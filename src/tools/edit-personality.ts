import { AVAILABLE_PERSONALITY_FIELDS, personalityStore } from "../stores/personality-store"
import type { Tool } from "../utils/ai-utilities"

export const editPersonalityTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "editPersonality",
      description: `Edit your personality settings - use this when the user wants to change your personality traits - possible settings are ${Object.keys(AVAILABLE_PERSONALITY_FIELDS).join(", ")}`,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(AVAILABLE_PERSONALITY_FIELDS).map(([key, config]) => [
            key,
            {
              type: config.type,
              description: config.description + (config.type === "number" ? " (0-10)" : "")
            }
          ])
        ),
        required: []
      }
    }
  },
  handler: async (args: {
    name?: string
    humour?: number
    empathy?: number
    intelligence?: number
    authority?: number
  }) => {
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
}
