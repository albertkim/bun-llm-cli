#! /usr/bin/env bun
import { input } from "@inquirer/prompts"
import chalk from "chalk"
import { existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import { clear } from "./commands/clear"
import { help } from "./commands/help"
import { version } from "./commands/version"
import { llmText } from "./lib/llm-text"
import { setUpAndGetConfig } from "./lib/set-up-and-get-config"
import { setUpAndGetDatabase } from "./lib/set-up-and-getdatabase"

// Ensure config directory exists
const dbDir = join(homedir(), ".config", "llm")
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

export const config = await setUpAndGetConfig()
export const db = await setUpAndGetDatabase()

// Define command line arguments
const args = process.argv.slice(2)

// If no arguments, print help
if (args.length === 0) {
  await help()
  process.exit(0)
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

// Identify the first AI provider that has an API key
const openaiKey = config.openai_api_key
const anthropicKey = config.anthropic_api_key
const googleAIKey = config.google_ai_api_key

if (!openaiKey && !anthropicKey && !googleAIKey) {
  console.log(chalk.red("No AI provider found"))
  process.exit(1)
}

// If not one of the commands above, accept arguments as a prompt
const prompt = args.join(" ")
if (!googleAIKey) {
  console.log(chalk.red("No Google AI API key found"))
  process.exit(1)
}

const result = await llmText(prompt, "google", "gemini-2.0-flash", googleAIKey)
console.log(`${chalk.green(`${result}`)}`)
