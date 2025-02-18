import { input, select } from "@inquirer/prompts"
import chalk from "chalk"
import { configStore } from "../stores/config-store"

export async function help() {
  console.log(chalk.bold.green("bun-llm-cli"))
  console.log()
  console.log(chalk("A CLI tool for interacting with LLMs"))
  console.log(chalk("Version: 0.0.1"))
  console.log(chalk(`Config directory: ${chalk.underline(configStore.configDir)}`))
  console.log()

  const hasOpenAIKey = configStore.config.openai_api_key !== null
  const hasAnthropicKey = configStore.config.anthropic_api_key !== null
  const hasGoogleAIKey = configStore.config.google_ai_api_key !== null

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
        await configStore.syncSingleConfig("openai_api_key", apiKey)
      } else if (provider === "Anthropic") {
        await configStore.syncSingleConfig("anthropic_api_key", apiKey)
      } else if (provider === "Google") {
        await configStore.syncSingleConfig("google_ai_api_key", apiKey)
      }

      console.log(chalk.green(`API key: ${apiKey}`))
      console.log(chalk.green("Now, you can prompt your LLM with the following command: llm your-prompt"))
      process.exit(0)
    } else if (answer === "n") {
      console.log("Exiting...")
    } else {
      console.log(chalk.red("Invalid input"))
    }
  }
}
