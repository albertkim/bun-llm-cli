import chalk from "chalk"
import { OpenAI } from "openai"
import { type ChatLog } from "../stores/database-store"

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

  const response = await client.chat.completions.create({
    model: model,
    messages: [...previousMessages, { role: "user" as const, content: prompt }],
    stream: true // Enable streaming
  })

  let fullResponse = ""

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content || ""
    fullResponse += content
    process.stdout.write(chalk.green(content))
  }
  process.stdout.write("\n")

  return fullResponse
}

export async function llmJSON(
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

  const response = await client.chat.completions.create({
    model: model,
    messages: [...previousMessages, { role: "user" as const, content: prompt }],
    response_format: { type: "json_object" },
    stream: false // No streaming required for JSON
  })

  const fullResponse = response.choices[0]?.message?.content || "unknown"

  return fullResponse
}
