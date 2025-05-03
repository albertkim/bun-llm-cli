import { openai } from "@ai-sdk/openai"
import { type CoreMessage, streamText } from "ai"
import chalk from "chalk"
import dotenv from "dotenv"
import { additionTool } from "./tools/addition"
import { editPersonalityTool } from "./tools/edit-personality"
import { editUserProfileTool } from "./tools/edit-user-profile"
import { getConfigDirectoryTool } from "./tools/get-config-directory"
import { viewPersonalityTool } from "./tools/view-personality"
import { viewUserProfileTool } from "./tools/view-user-profile"
import { weatherTool } from "./tools/weather"

dotenv.config({ path: "../.env" })

if (process.env.OPENAI_API_KEY === undefined) {
  console.warn("OPENAI_API_KEY is not set")
  process.exit(1)
} else {
  console.log("OPENAI_API_KEY is set")
}

// This acts as the in-memory conversation history
const messages: CoreMessage[] = []

async function main() {
  const prompt = "You: "
  process.stdout.write(prompt)

  for await (const line of console) {
    const userInput = line.trim()

    if (!userInput) {
      continue
    }

    messages.push({ role: "user", content: userInput })

    // The stream is an object - note that at this time, the response has not streamed in yet
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      tools: {
        addition: additionTool,
        weather: weatherTool,
        viewPersonality: viewPersonalityTool,
        viewUserProfile: viewUserProfileTool,
        getConfigDirectory: getConfigDirectoryTool,
        editPersonality: editPersonalityTool,
        editUserProfile: editUserProfileTool
      },
      maxSteps: 10,
      onStepFinish: (step) => {
        if (step.toolCalls.length > 0) {
          console.log(chalk.yellow(`\nTool: ${step.toolCalls[0].toolName}`))
          console.log(chalk.yellow(`${JSON.stringify(step.toolCalls[0].args)}\n`))
        }
      }
    })

    let fullResponse = ""
    process.stdout.write("\nAssistant: ")

    // This will be called as the response is streamed in, thus the await
    // The stream is just printed out to console, not stored into the message history yet
    for await (const delta of result.textStream) {
      fullResponse += delta
      process.stdout.write(delta)
    }
    process.stdout.write("\n\n")

    // This is the final completed response, which is stored into the message history
    // Interesting, it seems like we don't need to store tool calls in the message history, just the assistant responses
    messages.push({ role: "assistant", content: fullResponse })

    process.stdout.write(prompt)
  }
}

main().catch(console.error)
