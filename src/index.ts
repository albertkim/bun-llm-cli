#! /usr/bin/env bun
import { Database } from "bun:sqlite"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import { help } from "./commands/help"
import { version } from "./commands/version"

// Define database directory
const dbDir = join(homedir(), ".config", "llm")
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

// Define configuratioj json file
const configPath = join(dbDir, "config.json")
if (!existsSync(configPath)) {
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        apiKey: ""
      },
      null,
      2
    )
  )
}

// Define database path
const dbPath = join(dbDir, "data.db")
const db = new Database(dbPath)

// Initialize table
db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT)")

// Print path info
console.log("Local database initialized at:", dbPath)

// Make it clickable/openable
if (process.platform === "darwin") {
  console.log(`\x1b]8;;file://${dbDir}\x1b\\Open in Finder: ${dbDir}\x1b]8;;\x1b\\`)
  // spawn(["open", dbDir]) // Auto-open Finder
} else if (process.platform === "win32") {
  console.log(`Open in Explorer: file://${dbDir.replace(/\\/g, "/")}`)
  // spawn(["explorer", dbDir]) // Auto-open Explorer
} else {
  console.log(`Navigate manually: cd "${dbDir}"`)
}

// Define command line arguments
const args = process.argv.slice(2)

// If no arguments, print help
if (args.length === 0) {
  help()
}

// Define help command
if (args.includes("--help") || args.includes("-h")) {
  help()
}

// Define version command
if (args.includes("--version") || args.includes("-v")) {
  version()
}
