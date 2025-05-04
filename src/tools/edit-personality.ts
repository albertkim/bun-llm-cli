import { tool } from "ai"
import { z } from "zod"
import { AVAILABLE_PERSONALITY_FIELDS, personalityStore } from "../stores/personality-store"

export const editPersonalityTool = tool({
  description: `Edit your AI personality settings - use this when the user wants to change your personality traits - possible settings are ${Object.keys(AVAILABLE_PERSONALITY_FIELDS).join(", ")}`,
  parameters: z.object({
    name: z.string().optional(),
    humour: z.number().optional(),
    empathy: z.number().optional(),
    intelligence: z.number().optional(),
    authority: z.number().optional()
  }),
  execute: async (args) => {
    const updates = []

    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) {
        await personalityStore.syncSingleConfig(key as any, value)
        updates.push(`${key}: ${value}`)
      }
    }

    return {
      message: `Updated personality settings: ${updates.join(", ")}`,
      personality: personalityStore.personalityConfig
    }
  }
})
