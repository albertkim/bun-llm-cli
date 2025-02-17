import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export const DB_DIR = join(homedir(), ".config", "llm")
export const DB_PATH = join(DB_DIR, "data.db")

export const setUpAndGetDatabase = () => {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }
  const dbPath = join(DB_DIR, "data.db")
  const db = new Database(dbPath)

  // Initialize table
  db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT)")

  // Print path info
  console.log("Local database initialized at:", dbPath)
  return db
}
