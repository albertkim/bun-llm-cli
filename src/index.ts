#! /usr/bin/env bun
import { input } from "@inquirer/prompts"
import chalk from "chalk"
import { AIService } from "./commands/ai-service"
import { help } from "./commands/help"
import { version } from "./commands/version"
import { configStore } from "./stores/config-store"
import { databaseStore } from "./stores/database-store"
import { personalityStore } from "./stores/personality-store"
import { systemStore } from "./stores/system-store"
import { userProfileStore } from "./stores/user-profile-store"

// Initialize all stores because they're async
await configStore.init()
await databaseStore.init()
await systemStore.init()
await personalityStore.init()
await userProfileStore.init()

// Print system information
console.log(chalk.green("System Information:"))
console.log(chalk.green(`OS: ${systemStore.operatingSystem} - Arch: ${systemStore.architecture}`))
console.log(chalk.green(`CPU: ${systemStore.cpuCores} cores, GPU: ${systemStore.gpu || "None"}`))

// Define command line arguments
const args = process.argv.slice(2)

// If no arguments, enter interactive mode
if (args.length === 0) {
  // Identify the first AI provider that has an API key
  const openaiKey = configStore.config.openai_api_key
  const anthropicKey = configStore.config.anthropic_api_key
  const googleAIKey = configStore.config.google_ai_api_key

  if (!openaiKey && !anthropicKey && !googleAIKey) {
    await help()
  }

  const LLM_TEXT_MODEL_MAPPING = {
    openai: "gpt-4o-mini",
    anthropic: "claude-3.5-haiku",
    google: "gemini-2.0-flash"
  }

  let provider: string
  let model: string
  let apiKey: string

  if (openaiKey) {
    provider = "openai"
    model = LLM_TEXT_MODEL_MAPPING["openai"]
    apiKey = openaiKey
  } else if (anthropicKey) {
    provider = "anthropic"
    model = LLM_TEXT_MODEL_MAPPING["anthropic"]
    apiKey = anthropicKey
  } else if (googleAIKey) {
    provider = "google"
    model = LLM_TEXT_MODEL_MAPPING["google"]
    apiKey = googleAIKey
  } else {
    console.log(chalk.red("No AI provider found"))
    process.exit(1)
  }

  console.log(chalk.blue("Welcome to bun-llm-cli!"))
  console.log(chalk.blue("Type 'exit' or press Ctrl+C to quit."))

  while (true) {
    const prompt = await input({ message: ">" })

    if (prompt.trim() === "") {
      continue
    }

    if (prompt.toLowerCase() === "exit" || prompt.toLowerCase() === "quit") {
      process.exit(0)
    }

    if (prompt.toLowerCase() === "clear") {
      const confirmClearChatHistory = await input({
        message: "Do you want to clear your chat history? (y/n)",
        default: "n"
      })
      if (confirmClearChatHistory === "y") {
        await databaseStore.clearDatabase()
      }

      const confirmClearConfig = await input({
        message: "Do you want to clear your LLM API key configs? (y/n)",
        default: "n"
      })
      if (confirmClearConfig === "y") {
        await configStore.clearConfig()
      }

      continue
    }

    await AIService.getTextResponse(prompt, provider, model, apiKey)
  }
}

// Define help command
if (args[0] === "--help" || args[0] === "-h") {
  await help()
  process.exit(0)
}

// Define version command
if (args[0] === "--version" || args[0] === "-v") {
  await version()
  process.exit(0)
}
