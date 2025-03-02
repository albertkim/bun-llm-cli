import chalk from "chalk"
import { databaseStore, type CreateChatLog } from "../stores/database-store"
import { llmJSON, llmText } from "../utils/ai-utilities"

// This function detects the "significance" of a user message - if high enough, worth storing as part of the user profile
async function detectUserMessageSignificance(
  prompt: string,
  provider: string,
  model: string,
  apiKey: string
): Promise<number> {
  const response = await llmJSON(
    [],
    `
      You are an advanced and highly intelligent personal assistant for a user. Your goal is to learn about the user and their preferences.

      Given the following user message, determine if it is significant enough to be stored as part of the permanent user profile.

      Examples of significant messages:
      - A user talks about their preferences
      - A user talks about their history
      - A user talks about their goals
      - A user talks about their values
      - A user talks about their beliefs
      - A user talks about their interests
      - A user talks about their hobbies

      Examples of insignificant messages:
      - A user asks for the weather
      - A user asks for the time
      - A user asks for help with a task
      - A user asks for recommendations
      - A user asks for the news
      
      But of course, use your best judgement.

      Return a JSON object with the following format:

      {
        reason: string - a short explanation for your answer
        isSignificant: number - 0 if the message is insignificant, 1 if potentially useful or leading up to something important, 2 if important
      }

      The message is: ${prompt}
    `,
    provider,
    model,
    apiKey
  )

  return JSON.parse(response.response).isSignificant as number
}

export const AIService = {
  async getTextResponse(prompt: string, provider: string, model: string, apiKey: string) {
    const previousChatLogs = await databaseStore.getChatLogs()
    const significance = await detectUserMessageSignificance(prompt, provider, model, apiKey)
    console.log(chalk.gray(`${provider} - ${model} - significance score: ${significance}`))

    const result = await llmText(previousChatLogs, prompt, provider, model, apiKey)

    const chatLog: CreateChatLog = {
      prompt: prompt,
      response: result.response,
      significance: significance,
      provider: provider,
      model: model,
      tools_used: result.tools_used
    }

    await databaseStore.addChatLog(chatLog)

    return {
      response: result.response,
      significance: significance,
      tools_used: result.tools_used
    }
  }
}
