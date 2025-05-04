import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const DB_DIR = join(homedir(), ".config", "llm")
const DB_PATH = join(DB_DIR, "data.db")

// Define message types with standard roles
export type MessageRole = "user" | "assistant" | "tool" | "system"

// Define the base message type
export interface Message {
  id: number
  role: MessageRole
  content: string | null
  created_at: string
  model: string | null
  provider: string | null
  tool_calls: Array<{
    id: string
    type: string
    function: {
      name: string
      arguments: string
    }
  }> | null
  tool_call_id: string | null
  metadata: Record<string, any> | null
}

// Type for creating a new message
export type CreateMessage = Omit<Message, "id" | "created_at">

class DatabaseStore {
  private db: Database

  constructor() {
    this.db = new Database(":memory:")
  }

  public async init() {
    // Create directory if it doesn't exist
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true })
    }

    // Create and initialize the database
    this.db = new Database(DB_PATH)

    // Create the messages table
    this.db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT,
      model TEXT,
      provider TEXT,
      tool_calls TEXT,       -- JSON string of tool calls array
      tool_call_id TEXT,     -- ID to link tool responses with tool calls
      metadata TEXT,         -- JSON string for any additional metadata
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)

    return this
  }

  // Add a new message
  public async addMessage(message: CreateMessage): Promise<number> {
    // Serialize complex objects to JSON strings
    const toolCallsJson = message.tool_calls ? JSON.stringify(message.tool_calls) : null
    const metadataJson = message.metadata ? JSON.stringify(message.metadata) : null

    const sql = `
      INSERT INTO messages (role, content, model, provider, tool_calls, tool_call_id, metadata, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      message.role,
      message.content || null,
      message.model || null,
      message.provider || null,
      toolCallsJson || null,
      message.tool_call_id || null,
      metadataJson || null,
      new Date().toISOString()
    ]

    const result = this.db.run(sql, params)

    return result.lastInsertRowid as number
  }

  // Get messages
  public async getMessages(limit: number = 100): Promise<Message[]> {
    const rows = this.db.query(`SELECT * FROM messages ORDER BY id ASC LIMIT ${limit}`).all() as any[]

    // Parse JSON strings back to objects
    return rows.map((row) => ({
      ...row,
      tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }))
  }

  // Get formatted messages for LLM API
  public async getMessagesForLLM(limit: number = 50): Promise<any[]> {
    const messages = await this.getMessages(limit)

    // Format messages in the structure expected by OpenAI API
    return messages.map((msg) => {
      // Handle user and system messages
      if (msg.role === "user" || msg.role === "system") {
        return {
          role: msg.role,
          content: msg.content
        }
      }

      // Handle assistant messages
      if (msg.role === "assistant") {
        // If assistant used tools, include tool_calls
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          return {
            role: "assistant",
            content: msg.content,
            tool_calls: msg.tool_calls
          }
        }

        // Regular assistant message
        return {
          role: "assistant",
          content: msg.content
        }
      }

      // Handle tool response messages
      if (msg.role === "tool" && msg.tool_call_id) {
        return {
          role: "tool",
          tool_call_id: msg.tool_call_id,
          content: msg.content
        }
      }

      // Fallback for any other message type
      return {
        role: msg.role,
        content: msg.content
      }
    })
  }

  // Clear all messages
  public clearDatabase(): void {
    this.db.run("DELETE FROM messages")
  }
}

// Export a singleton instance
export const databaseStore = new DatabaseStore()
