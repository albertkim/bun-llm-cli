import chalk from "chalk"
import { OpenAI } from "openai"
import { type ChatLog } from "../stores/database-store"
import { additionTool } from "../tools/addition"
import { weatherTool } from "../tools/weather"

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

const tools = [additionTool, weatherTool]

type ChatCompletionRequestOptions = {
  model: string
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool"
    content: string
    tool_call_id?: string
    name?: string
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

export async function llmText(
  previousChatLogs: ChatLog[],
  prompt: string,
  provider: string,
  model: string,
  apiKey: string
) {
  const client = getClient(provider, apiKey)

  // Convert previous chat logs into message format
  const previousMessages = previousChatLogs
    .reverse() // Oldest messages first
    .flatMap((log) => [
      { role: "user" as const, content: log.prompt },
      { role: "assistant" as const, content: log.response }
    ])

  const messages = [...previousMessages, { role: "user" as const, content: prompt }]

  // Extract tool definitions for API request
  const toolDefinitions = tools.map((tool) => tool.definition)

  // Create a map of function names to their handlers
  const toolHandlers = Object.fromEntries(tools.map((tool) => [tool.definition.function.name, tool.handler]))

  // Create initial request options
  const requestOptions: ChatCompletionRequestOptions = {
    model: model,
    messages: messages,
    tools: toolDefinitions,
    tool_choice: "auto",
    stream: false
  }

  // Call the API
  const response = await client.chat.completions.create(requestOptions as any)
  const assistantMessage = response.choices[0].message
  const toolCalls = assistantMessage.tool_calls || []

  // If no tool calls were made, return the direct response
  if (toolCalls.length === 0) {
    const content = assistantMessage.content || ""
    process.stdout.write(chalk.green(content + "\n"))
    return {
      response: content,
      tools_used: null
    }
  }

  // Otherwise, process the tool calls
  console.log(chalk.yellow("🔧 Model is using tools..."))

  const toolResults = []
  const usedTools = []

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name
    const functionHandler = toolHandlers[functionName]

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

      toolResults.push({
        tool_call_id: toolCall.id,
        role: "tool" as const,
        content: JSON.stringify(result)
      })

      usedTools.push({
        name: functionName,
        args: args,
        result: result
      })
    } catch (error) {
      console.error(chalk.red(`Error executing tool ${functionName}:`), error)
      toolResults.push({
        tool_call_id: toolCall.id,
        role: "tool" as const,
        content: JSON.stringify({ error: (error as Error).message })
      })
    }
  }

  // Get final response with tool results (use streaming for a better chat experience)
  const secondResponse = await client.chat.completions.create({
    model: model,
    messages: [...messages, assistantMessage, ...toolResults],
    stream: true
  })

  let fullResponse = ""
  for await (const chunk of secondResponse) {
    const content = chunk.choices[0]?.delta?.content || ""
    fullResponse += content
    process.stdout.write(chalk.green(content))
  }
  process.stdout.write("\n")

  return {
    response: fullResponse,
    tools_used: usedTools.length > 0 ? JSON.stringify(usedTools) : null
  }
}

export async function llmJSON(
  previousChatLogs: ChatLog[],
  prompt: string,
  provider: string,
  model: string,
  apiKey: string,
  tools: Tool[] = []
) {
  const client = getClient(provider, apiKey)

  // Convert previous chat logs into message format
  const previousMessages = previousChatLogs
    .reverse() // Oldest messages first
    .flatMap((log) => [
      { role: "user" as const, content: log.prompt },
      { role: "assistant" as const, content: log.response }
    ])

  const messages = [...previousMessages, { role: "user" as const, content: prompt }]

  // Extract tool definitions for API request
  const toolDefinitions = tools.map((tool) => tool.definition)

  // Create a map of function names to their handlers
  const toolHandlers = Object.fromEntries(tools.map((tool) => [tool.definition.function.name, tool.handler]))

  // Create initial request options
  const requestOptions: ChatCompletionRequestOptions = {
    model: model,
    messages: messages,
    response_format: { type: "json_object" },
    tools: toolDefinitions,
    tool_choice: "auto",
    stream: false
  }

  const response = await client.chat.completions.create(requestOptions as any)
  const assistantMessage = response.choices[0].message
  const toolCalls = assistantMessage.tool_calls || []

  // If no tool calls requested, return the JSON response directly
  if (toolCalls.length === 0) {
    return {
      response: assistantMessage.content || "{}",
      tools_used: null
    }
  }

  // Process tool calls
  console.log(chalk.yellow("🔧 Model is using tools for JSON response..."))

  const toolResults = []
  const usedTools = []

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name
    const functionHandler = toolHandlers[functionName]

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

      toolResults.push({
        tool_call_id: toolCall.id,
        role: "tool" as const,
        content: JSON.stringify(result)
      })

      usedTools.push({
        name: functionName,
        args: args,
        result: result
      })
    } catch (error) {
      console.error(chalk.red(`Error executing tool ${functionName}:`), error)
      toolResults.push({
        tool_call_id: toolCall.id,
        role: "tool" as const,
        content: JSON.stringify({ error: (error as Error).message })
      })
    }
  }

  // Get final response with tool results
  const secondResponse = await client.chat.completions.create({
    model: model,
    messages: [...messages, assistantMessage, ...toolResults],
    response_format: { type: "json_object" },
    stream: false
  })

  return {
    response: secondResponse.choices[0]?.message?.content || "{}",
    tools_used: usedTools.length > 0 ? JSON.stringify(usedTools) : null
  }
}
