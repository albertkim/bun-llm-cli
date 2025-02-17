import { Database } from "bun:sqlite"
import { existsSync, mkdirSync, unlinkSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export const DB_DIR = join(homedir(), ".config", "llm")
export const DB_PATH = join(DB_DIR, "data.db")

export async function setUpAndGetDatabase() {
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

  return db
}

export async function getDatabase() {
  return new Database(DB_PATH)
}

export async function clearDatabase() {
  // Delete the database file
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH)
  }
}
