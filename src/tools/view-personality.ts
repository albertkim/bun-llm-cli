import { tool } from "ai"
import { z } from "zod"
import { personalityStore } from "../stores/personality-store"

export const viewPersonalityTool = tool({
  description:
    "View your current personality settings - if the user asks anything about your personality, use this tool.",
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify(personalityStore.personalityConfig, null, 2)
  }
})
