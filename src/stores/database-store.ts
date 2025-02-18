import { Database } from "bun:sqlite"
import { existsSync, mkdirSync, unlinkSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const DB_DIR = join(homedir(), ".config", "llm")
const DB_PATH = join(DB_DIR, "data.db")

class DatabaseStore {
  private db: Database

  constructor() {
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
      response TEXT,
      provider TEXT,
      model TEXT,
      created_at TEXT
    )`)

    this.db = db
  }

  public async init() {
    // Do nothing for now
  }

  public getDatabase() {
    return this.db
  }

  public clearDatabase() {
    if (existsSync(DB_PATH)) {
      unlinkSync(DB_PATH)
    }
  }
}

export const databaseStore = new DatabaseStore()
