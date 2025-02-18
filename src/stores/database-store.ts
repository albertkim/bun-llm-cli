import { Database } from "bun:sqlite"
import { existsSync, mkdirSync, unlinkSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const DB_DIR = join(homedir(), ".config", "llm")
const DB_PATH = join(DB_DIR, "data.db")

export type ChatLog = {
  id: number
  prompt: string
  significance: number
  response: string
  provider: string
  model: string
  created_at: string
}

export type CreateChatLog = Omit<ChatLog, "id" | "created_at">

class DatabaseStore {
  private db: Database

  constructor() {
    // Initialize in-memory database
    // Program entry point should call init() because it's async
    this.db = new Database(":memory:")
  }

  public async init() {
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true })
    }
    const dbPath = join(DB_DIR, "data.db")
    const db = new Database(dbPath)

    // Initialize table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      name TEXT
    )`)

    // Initialize chat logs table
    db.run(`CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY,
      prompt TEXT,
      significance INTEGER,
      response TEXT,
      provider TEXT,
      model TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`)

    this.db = db
  }

  public getDatabase() {
    return this.db
  }

  public async getChatLogs(limit: number = 10): Promise<ChatLog[]> {
    const chatLogs = await this.db.query(`SELECT * FROM chat_logs ORDER BY created_at ASC LIMIT ${limit}`).all()
    return chatLogs as ChatLog[]
  }

  public async addChatLog(chatLog: CreateChatLog) {
    await this.db.run(
      "INSERT INTO chat_logs (prompt, significance, response, provider, model, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        chatLog.prompt,
        chatLog.significance,
        chatLog.response,
        chatLog.provider,
        chatLog.model,
        new Date().toISOString()
      ]
    )
  }

  public async clearDatabase() {
    if (existsSync(DB_PATH)) {
      unlinkSync(DB_PATH)
    }
    this.init()
  }
}

export const databaseStore = new DatabaseStore()
