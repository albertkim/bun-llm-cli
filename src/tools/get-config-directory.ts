import { homedir } from "os"
import { join } from "path"
import type { Tool } from "../utils/ai-utilities"

const CONFIG_DIR = join(homedir(), ".config", "llm")

export const getConfigDirectoryTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "getConfigDirectory",
      description: "Get the location of the configuration/settings directory where settings are stored",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  handler: async () => {
    return {
      configDirectory: CONFIG_DIR,
      message: `Your settings are stored in: ${CONFIG_DIR}`
    }
  }
}
