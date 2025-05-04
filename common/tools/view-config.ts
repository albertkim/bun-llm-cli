import { configStore } from "../stores/config-store"
import type { Tool } from "../utils/ai-utilities"

export const viewConfigTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "viewConfig",
      description: "View your current LLM API configuration settings",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  handler: async () => {
    return {
      config: configStore.config
    }
  }
}
