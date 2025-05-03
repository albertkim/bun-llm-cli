import { tool } from "ai"
import { z } from "zod"

export const additionTool = tool({
  description: "Add an array of numbers together and return the sum",
  parameters: z.object({
    numbers: z.array(z.number()).describe("Array of numbers to add together")
  }),
  execute: async (args) => {
    return {
      result: args.numbers.reduce((acc, curr) => acc + curr, 0)
    }
  }
})
