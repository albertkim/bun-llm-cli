#! /usr/bin/env bun
import chalk from "chalk"
import { existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"
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
  help()
  process.exit(0)
}

// Define help command
if (args[0] === "--help" || args[0] === "-h") {
  help()
  process.exit(0)
}

// Define version command
if (args[0] === "--version" || args[0] === "-v") {
  version()
  process.exit(0)
}

// If not one of the commands above, accept arguments as a prompt
const prompt = args.join(" ")
if (!config.google_ai_api_key) {
  console.log(chalk.red("No Google AI API key found"))
  process.exit(1)
}
const result = await llmText(prompt, "google", "gemini-2.0-flash", config.google_ai_api_key)
console.log(`${chalk.green(`${result}`)}`)
