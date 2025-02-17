import { input, select } from "@inquirer/prompts"
import chalk from "chalk"
import { CONFIG_DIR, setUpAndGetConfig, syncSingleConfig } from "../lib/set-up-and-get-config"

export async function help() {
  console.log(chalk.bold.green("bun-llm-cli"))
  console.log()
  console.log(chalk("A CLI tool for interacting with LLMs"))
  console.log(chalk("Version: 0.0.1"))
  console.log(chalk(`Config directory: ${chalk.underline(CONFIG_DIR)}`))
  console.log()

  const config = await setUpAndGetConfig()
  const hasOpenAIKey = config.openai_api_key !== null
  const hasAnthropicKey = config.anthropic_api_key !== null
  const hasGoogleAIKey = config.google_ai_api_key !== null

  if (!hasOpenAIKey && !hasAnthropicKey && !hasGoogleAIKey) {
    console.log(chalk.red("No LLM API keys found"))

    const answer = await input({
      message: `Would you like to set one? ${chalk.yellow("(y/n)")}`
    })

    if (answer === "y") {
      const provider = await select({
        message: "Which AI provider?",
        choices: ["OpenAI", "Anthropic", "Google"]
      })

      console.log(chalk.green(`Selected provider: ${provider}`))
      // Now prompt for API key input and store it
      const apiKey = await input({
        message: "Enter your API key (cmd/ctrl + c to exit):"
      })

      if (provider === "OpenAI") {
        await syncSingleConfig("openai_api_key", apiKey)
      } else if (provider === "Anthropic") {
        await syncSingleConfig("anthropic_api_key", apiKey)
      } else if (provider === "Google") {
        await syncSingleConfig("google_ai_api_key", apiKey)
      }

      console.log(chalk.green(`API key: ${apiKey}`))
    } else if (answer === "n") {
      console.log("Exiting...")
    } else {
      console.log(chalk.red("Invalid input"))
    }
  }
}
