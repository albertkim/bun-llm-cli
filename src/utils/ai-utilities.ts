import chalk from "chalk"
import { OpenAI } from "openai"
import { databaseStore, type Message } from "../stores/database-store"

// Define the tool interface
export interface Tool {
  definition: {
    type: "function"
    function: {
      name: string
      description: string
      parameters: Record<string, any>
    }
  }
  handler: (args: any) => Promise<any> | any
}

type ChatCompletionRequestOptions = {
  model: string
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool"
    content: string | null
    tool_call_id?: string
    tool_calls?: Array<{
      id: string
      type: string
      function: {
        name: string
        arguments: string
      }
    }>
  }>
  stream?: boolean
  tools?: Array<{
    type: string
    function: {
      name: string
      description: string
      parameters: Record<string, any>
    }
  }>
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } }
  response_format?: { type: "json_object" | "text" }
}

export function getClient(provider: string, apiKey: string) {
  if (provider === "openai") {
    return new OpenAI({
      baseURL: "https://api.openai.com/v1",
      apiKey: apiKey
    })
  } else if (provider === "anthropic") {
    return new OpenAI({
      baseURL: "https://api.anthropic.com/v1",
      apiKey: apiKey
    })
  } else if (provider === "google") {
    return new OpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: apiKey
    })
  } else {
    throw new Error(`Provider ${provider} not supported`)
  }
}

async function detectUserMessageSignificance(
  prompt: string,
  provider: string,
  model: string,
  apiKey: string
): Promise<number> {
  const response = await llmJSON(
    [],
    `
      You are an advanced and highly intelligent personal assistant for a user. Your goal is to learn about the user and their preferences.
      Given the following user message, determine if it is significant enough to be stored as part of the permanent user profile.
      Examples of significant messages:
      - A user talks about their preferences
      - A user talks about their history
      - A user talks about their goals
      - A user talks about their values
      - A user talks about their beliefs
      - A user talks about their interests
      - A user talks about their hobbies
      Examples of insignificant messages:
      - A user asks for the weather
      - A user asks for the time
      - A user asks for help with a task
      - A user asks for recommendations
      - A user asks for the news
      
      But of course, use your best judgement.
      Return a JSON object with the following format:
      {
        reason: string - a short explanation for your answer
        isSignificant: number - 0 if the message is insignificant, 1 if potentially useful or leading up to something important, 2 if important
      }
      The message is: ${prompt}
    `,
    provider,
    model,
    apiKey
  )
  return JSON.parse(response.response).isSignificant as number
}

export async function llmText(
  previousMessages: Message[],
  prompt: string,
  provider: string,
  tools: Tool[],
  model: string,
  apiKey: string
) {
  const significance = await detectUserMessageSignificance(prompt, provider, model, apiKey)
  console.log(chalk.gray(`${provider} - ${model} - significance score: ${significance}`))

  const client = getClient(provider, apiKey)

  // Get formatted message history from the store
  const formattedMessages = await databaseStore.getMessagesForLLM(50)

  // Add the current user message
  formattedMessages.push({
    role: "user",
    content: prompt
  })

  // Extract tool definitions for API request
  const toolDefinitions = tools.map((tool) => tool.definition)

  // Create a map of function names to their handlers
  const toolHandlers = Object.fromEntries(tools.map((tool) => [tool.definition.function.name, tool.handler]))

  // Create initial request options
  const requestOptions: ChatCompletionRequestOptions = {
    model: model,
    messages: formattedMessages,
    tools: toolDefinitions,
    tool_choice: "auto",
    stream: false
  }

  // Call the API
  const response = await client.chat.completions.create(requestOptions as any)

  const assistantMessage = response.choices[0].message
  const toolCalls = assistantMessage.tool_calls || []

  // Save user message to database
  await databaseStore.addMessage({
    role: "user",
    content: prompt,
    tool_calls: null,
    tool_call_id: null,
    model: model,
    provider: provider,
    metadata: { significance }
  })

  // If no tool calls were made, return the direct response
  if (toolCalls.length === 0) {
    const content = assistantMessage.content || ""
    process.stdout.write(chalk.green(content + "\n"))

    // Add assistant message to database
    await databaseStore.addMessage({
      role: "assistant",
      content: content,
      tool_calls: null,
      tool_call_id: null,
      model: model,
      provider: provider,
      metadata: null
    })

    return {
      response: content,
      significance: significance,
      tools_used: null
    }
  }

  // Otherwise, process the tool calls
  console.log(
    chalk.yellow(`🔧 Model is using tools: ${toolCalls.map((toolCall) => toolCall.function.name).join(", ")}`)
  )

  // Save assistant message with tool calls
  await databaseStore.addMessage({
    role: "assistant",
    content: assistantMessage.content,
    tool_calls: toolCalls,
    tool_call_id: null,
    model: model,
    provider: provider,
    metadata: null
  })

  const toolResults = []
  const usedTools = []

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name
    const functionHandler = toolHandlers[functionName]

    // Use the tool call ID from the API or generate one if missing
    const toolCallId = toolCall.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    if (!functionHandler) {
      console.log(chalk.red(`Tool ${functionName} not found in handlers`))
      continue
    }

    try {
      // Parse arguments and call the handler
      const args = JSON.parse(toolCall.function.arguments)
      console.log(chalk.yellow(`Calling ${functionName} with args:`), args)

      const result = await functionHandler(args)
      console.log(chalk.yellow(`Result from ${functionName}:`), result)

      // Add tool response to database
      await databaseStore.addMessage({
        role: "tool",
        content: JSON.stringify(result),
        tool_calls: null,
        tool_call_id: toolCallId,
        model: model,
        provider: provider,
        metadata: { tool_name: functionName, args }
      })

      toolResults.push({
        role: "tool",
        tool_call_id: toolCallId,
        content: JSON.stringify(result)
      })

      usedTools.push({
        id: toolCallId,
        name: functionName,
        args,
        result
      })
    } catch (error) {
      console.error(chalk.red(`Error executing tool ${functionName}:`), error)

      // Save error response
      await databaseStore.addMessage({
        role: "tool",
        content: JSON.stringify({ error: (error as Error).message }),
        tool_calls: null,
        tool_call_id: toolCallId,
        model: model,
        provider: provider,
        metadata: { tool_name: functionName, error: (error as Error).message }
      })

      toolResults.push({
        role: "tool",
        tool_call_id: toolCallId,
        content: JSON.stringify({ error: (error as Error).message })
      })
    }
  }

  // Get final response with tool results
  const secondResponse = await client.chat.completions.create({
    model: model,
    messages: [...formattedMessages, assistantMessage, ...toolResults] as any,
    stream: true
  })

  let fullResponse = ""
  for await (const chunk of secondResponse) {
    const content = chunk.choices[0]?.delta?.content || ""
    fullResponse += content
    process.stdout.write(chalk.green(content))
  }
  process.stdout.write("\n")

  // Add assistant's final response to database
  await databaseStore.addMessage({
    role: "assistant",
    content: fullResponse,
    tool_calls: null,
    tool_call_id: null,
    model: model,
    provider: provider,
    metadata: usedTools.length > 0 ? { tools_used: usedTools } : null
  })

  return {
    response: fullResponse,
    significance: significance,
    tools_used: usedTools.length > 0 ? JSON.stringify(usedTools) : null
  }
}

export async function llmJSON(
  previousMessages: Message[],
  prompt: string,
  provider: string,
  model: string,
  apiKey: string
) {
  const client = getClient(provider, apiKey)

  // Get formatted message history from the store
  let messages = previousMessages.length > 0 ? await databaseStore.getMessagesForLLM(50) : []

  // Add the current prompt
  messages.push({
    role: "user",
    content: prompt
  })

  // Create request options
  const requestOptions = {
    model: model,
    messages: messages,
    response_format: { type: "json_object" },
    stream: false
  }

  // Get response
  const response = await client.chat.completions.create(requestOptions as any)

  return {
    response: response.choices[0]?.message?.content || "{}"
  }
}
