export const weatherTool = {
  definition: {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state/country to get weather for"
          }
        },
        required: ["location"]
      }
    }
  },

  // Handler function that implements the tool
  handler: async (args: { location: string }) => {
    // This is just sample data for testing purposes
    return {
      location: args.location,
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
}
