import { tool } from "ai"
import { homedir } from "os"
import { join } from "path"
import { z } from "zod"

const CONFIG_DIR = join(homedir(), ".config", "llm")

export const getConfigDirectoryTool = tool({
  description: "Get the location of the configuration/settings directory where settings are stored",
  parameters: z.object({}),
  execute: async () => {
    return CONFIG_DIR
  }
})
