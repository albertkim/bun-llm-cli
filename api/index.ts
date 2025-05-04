import { openai } from "@ai-sdk/openai"
import { streamText, type CoreMessage } from "ai"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"

dotenv.config({ path: "../.env" })

if (process.env.OPENAI_API_KEY === undefined) {
  console.warn("OPENAI_API_KEY is not set")
  process.exit(1)
} else {
  console.log("OPENAI_API_KEY is set")
}

const app = express()
const port = process.env.PORT || 3001

const messageHistory: CoreMessage[] = []

app.use(cors())
app.use(express.json())

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Basic health check endpoint
app.get("/health", async (req, res) => {
  res.json({ status: "ok" })
})

// Stream endpoint using Vercel AI SDK
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body

    messageHistory.push(...messages)

    console.log(`Messages: ${JSON.stringify(req.body)}`)

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid messages format" })
      return
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: messageHistory
    })

    result.pipeTextStreamToResponse(res)
  } catch (error) {
    console.error("Error in chat stream:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
