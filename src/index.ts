#! /usr/bin/env bun
import { input } from "@inquirer/prompts"
import chalk from "chalk"
import { existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import { clear } from "./commands/clear"
import { help } from "./commands/help"
import { version } from "./commands/version"
import { setUpAndGetConfig } from "./lib/config"
import { setUpAndGetDatabase } from "./lib/database"
import { llmText } from "./utils/ai-utilities"

// Ensure config directory exists
const dbDir = join(homedir(), ".config", "llm")
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

export const config = await setUpAndGetConfig()
export const db = await setUpAndGetDatabase()

// Define command line arguments
const args = process.argv.slice(2)

// If no arguments, enter interactive mode
if (args.length === 0) {
  // Identify the first AI provider that has an API key
  const openaiKey = config.openai_api_key
  const anthropicKey = config.anthropic_api_key
  const googleAIKey = config.google_ai_api_key

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

  console.log(chalk.blue("Type 'exit' or press Ctrl+C to quit."))
  while (true) {
    const prompt = await input({ message: ">" })

    if (prompt.trim() === "") {
      continue
    }

    if (prompt.toLowerCase() === "exit" || prompt.toLowerCase() === "quit") {
      process.exit(0)
    }

    const result = await llmText(prompt, provider, model, apiKey)
    db.run(
      `INSERT INTO chat_logs (prompt, response, provider, model, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [prompt, result, provider, model, new Date().toISOString()]
    )

    console.log(chalk.gray(`${provider} - ${model}`))
    console.log(`${chalk.green(`${result}`)}`)
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

// Define clear command
if (args[0] === "clear") {
  const confirm = await input({
    message: "Are you sure you want to clear the config?",
    default: "y"
  })
  if (confirm === "y") {
    await clear()
    process.exit(0)
  } else {
    console.log(chalk.red("Config not cleared"))
  }
}
