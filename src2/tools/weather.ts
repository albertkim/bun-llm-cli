import { tool } from "ai"
import { z } from "zod"

export const weatherTool = tool({
  description: "Get the current weather for a location",
  parameters: z.object({
    location: z.string().describe("The city and state/country to get weather for")
  }),
  execute: async ({ location }) => {
    return {
      location: location,
      temperature: {
        current: 72,
        feels_like: 74,
        min: 65,
        max: 80
      },
      conditions: "Partly Cloudy",
      humidity: 45,
      wind: {
        speed: 8,
        direction: "NE"
      },
      precipitation: {
        chance: 20,
        type: "rain"
      },
      forecast: [
        { day: "Today", high: 80, low: 65, conditions: "Partly Cloudy" },
        { day: "Tomorrow", high: 82, low: 67, conditions: "Sunny" },
        { day: "Wednesday", high: 78, low: 64, conditions: "Scattered Showers" }
      ]
    }
  }
})
