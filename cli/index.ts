import { type CoreMessage, streamText } from "ai"
import chalk from "chalk"
import dotenv from "dotenv"
import { DEFAULT_LLM_PROVIDER, getSystemPrompt, tools } from "../common/config"
import { databaseStore } from "../common/stores/database-store"

dotenv.config({ path: "../.env" })

if (process.env.OPENAI_API_KEY === undefined) {
  console.warn("OPENAI_API_KEY is not set")
  process.exit(1)
} else {
  console.log("OPENAI_API_KEY is set")
}

console.log(chalk.green("Initializing Bun LLM CLI..."))

// Load the conversation history from the database
await databaseStore.init()

// This acts as the in-memory conversation history
const messages: CoreMessage[] = []

async function loadConversationHistory() {
  const conversationHistory = await databaseStore.getMessages()
  messages.length = 0
  messages.push({ role: "system", content: await getSystemPrompt() })
  if (conversationHistory) {
    for (const message of conversationHistory) {
      if (message.role === "user" || message.role === "assistant") {
        messages.push({
          role: message.role,
          content: message.content ?? ""
        })
      }
    }
  }
}

await loadConversationHistory()
console.log(chalk.yellow(`Conversation history loaded (${messages.length} messages)`))

async function main() {
  const prompt = "You: "
  process.stdout.write(chalk.green(prompt))

  for await (const line of console) {
    const userInput = line.trim()

    if (!userInput) {
      continue
    }

    messages.push({ role: "user", content: userInput })

    // The stream is an object - note that at this time, the response has not streamed in yet
    const result = streamText({
      model: DEFAULT_LLM_PROVIDER,
      messages,
      tools: tools,
      maxSteps: 10,
      onStepFinish: (step) => {
        if (step.toolCalls.length > 0) {
          console.log(chalk.yellow(`\nTool: ${step.toolCalls[0].toolName}`))
          console.log(chalk.yellow(`${JSON.stringify(step.toolCalls[0].args)}\n`))
        }
      },
      onError: (error) => {
        console.error(chalk.red("Error: "), error)
      }
    })

    let fullResponse = ""
    process.stdout.write(chalk.blue("\nAssistant: "))

    // This will be called as the response is streamed in, thus the await
    // The stream is just printed out to console, not stored into the message history yet
    for await (const delta of result.textStream) {
      fullResponse += delta
      process.stdout.write(delta)
    }
    process.stdout.write("\n\n")

    // This is the final completed response, which is stored into the message history
    // Interesting, it seems like we don't need to store tool calls in the message history, just the assistant responses

    // Re-load the conversation history from the database to ensure it's up to date
    await loadConversationHistory()

    messages.push({ role: "assistant", content: fullResponse })
    databaseStore.addMessage({
      role: "assistant",
      content: fullResponse,
      model: "gpt-4o",
      provider: "openai",
      tool_calls: null,
      tool_call_id: null,
      metadata: null
    })

    process.stdout.write(prompt)
  }
}

main().catch(console.error)
