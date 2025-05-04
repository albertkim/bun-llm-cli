import { tool } from "ai"
import { z } from "zod"
import { databaseStore } from "../stores/database-store"

export const clearChatHistoryTool = tool({
  description: "Clear the chat history. Ask the user if they are sure they want to do this.",
  parameters: z.object({}),
  execute: async () => {
    await databaseStore.clearDatabase()
    return {
      message: "Chat history has been cleared."
    }
  }
})
