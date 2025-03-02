import { personalityStore } from "../stores/personality-store"
import type { Tool } from "../utils/ai-utilities"

export const viewPersonalityTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "viewPersonality",
      description:
        "View your current personality settings - if the user asks anything about your personality, use this tool.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  handler: async () => {
    return {
      personality: personalityStore.personalityConfig
    }
  }
}
