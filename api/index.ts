import { streamText, type CoreMessage } from "ai"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import { DEFAULT_LLM_PROVIDER, getSystemPrompt, tools } from "../common/config"
import { databaseStore } from "../common/stores/database-store"
import { personalityStore, type PersonalityConfigType } from "../common/stores/personality-store"
import { userProfileStore, type UserProfileConfigType } from "../common/stores/user-profile-store"

dotenv.config({ path: "../.env" })

if (process.env.OPENAI_API_KEY === undefined) {
  console.warn("OPENAI_API_KEY is not set")
  process.exit(1)
} else {
  console.log("OPENAI_API_KEY is set")
}

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Initialize stores
let currentPersonality: PersonalityConfigType | null = null
let currentUserProfile: UserProfileConfigType | null = null
let messages: CoreMessage[] = []

async function initializeStores() {
  await databaseStore.init()
  currentPersonality = await personalityStore.getConfig()
  currentUserProfile = await userProfileStore.getConfig()

  const conversationHistory = await databaseStore.getMessages()
  messages = []
  messages.push({ role: "system", content: await getSystemPrompt() })

  if (conversationHistory) {
    for (const message of conversationHistory) {
      if (message.role === "user" || message.role === "assistant") {
        messages.push({
          role: message.role,
          content: message.content ?? ""
        })
      }
    }
  }
}

// Basic health check endpoint
app.get("/health", async (req, res) => {
  res.json({ status: "ok" })
})

// Stream endpoint using Vercel AI SDK
app.post("/api/chat", async (req, res) => {
  try {
    const { messages: newMessages } = req.body

    if (!newMessages || !Array.isArray(newMessages)) {
      res.status(400).json({ error: "Invalid messages format" })
      return
    }

    // Add new messages to the conversation
    messages.push(...newMessages)

    const result = streamText({
      model: DEFAULT_LLM_PROVIDER,
      messages,
      tools: tools,
      maxSteps: 10,
      onStepFinish: async (step) => {
        messages.push({ role: "assistant", content: step.text })
        await databaseStore.addMessage({
          role: "assistant",
          content: step.text,
          model: "gpt-4o",
          provider: "openai",
          tool_calls: null,
          tool_call_id: null,
          metadata: null
        })
      },
      onError: (error) => {
        console.error("Error in chat stream:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    })

    result.pipeTextStreamToResponse(res)
  } catch (error) {
    console.error("Error in chat stream:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

await initializeStores()

app.listen(port, () => {
  console.log(`API Server running on port ${port}`)
})
