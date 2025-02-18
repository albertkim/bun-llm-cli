import chalk from "chalk"
import { OpenAI } from "openai"
import { databaseStore } from "../stores/database-store"

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

export async function llmText(prompt: string, provider: string, model: string, apiKey: string) {
  const db = databaseStore.getDatabase()

  // Get previous X chat logs if exists
  const previousChatLogs: {
    id: number
    prompt: string
    response: string
    provider: string
    model: string
    created_at: string
  }[] = (await db
    .query(
      `
        SELECT id, prompt, response, provider, model, created_at FROM chat_logs
        ORDER BY created_at DESC
        LIMIT 10
      `
    )
    .all()) as {
    id: number
    prompt: string
    response: string
    provider: string
    model: string
    created_at: string
  }[]

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
  process.stdout.write(chalk.gray(`${provider} - ${model}\n`))

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content || ""
    fullResponse += content
    process.stdout.write(chalk.green(content))
  }
  process.stdout.write("\n")

  // Store the complete response in the database
  db.run(
    `INSERT INTO chat_logs (prompt, response, provider, model, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [prompt, fullResponse, provider, model, new Date().toISOString()]
  )

  return fullResponse
}
