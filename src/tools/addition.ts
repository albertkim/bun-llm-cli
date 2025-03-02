export const additionTool = {
  definition: {
    type: "function",
    function: {
      name: "addition",
      description: "Add an array of numbers together and return the sum",
      parameters: {
        type: "object",
        properties: {
          numbers: {
            type: "array",
            items: {
              type: "number"
            },
            description: "Array of numbers to add together"
          }
        },
        required: ["numbers"]
      }
    }
  },

  // Handler function that implements the tool
  handler: async (args: { numbers: number[] }) => {
    return {
      result: args.numbers.reduce((acc, curr) => acc + curr, 0)
    }
  }
}
