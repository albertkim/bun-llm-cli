import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CONFIG_DIR = join(homedir(), ".config", "llm")
const CONFIG_PATH = join(CONFIG_DIR, "user-profile.json")

export type UserProfileConfigType = {
  name: string | null
  location: string | null
  age: number | null
  gender: string | null
  occupation: string | null
  interests: string | null
  goals: string | null
  values: string | null
  beliefs: string | null
  challenges: string | null
  life_story: string | null
}

export const AVAILABLE_USER_PROFILE_FIELDS: Record<
  keyof UserProfileConfigType,
  { key: keyof UserProfileConfigType; type: string; description: string }
> = {
  name: {
    key: "name",
    type: "string",
    description: "The user's name"
  },
  location: {
    key: "location",
    type: "string",
    description: "Where the user lives"
  },
  age: {
    key: "age",
    type: "number",
    description: "The user's age"
  },
  gender: {
    key: "gender",
    type: "string",
    description: "The user's gender identity"
  },
  occupation: {
    key: "occupation",
    type: "string",
    description: "The user's job or profession"
  },
  interests: {
    key: "interests",
    type: "string",
    description: "The user's hobbies and interests"
  },
  goals: {
    key: "goals",
    type: "string",
    description: "What the user wants to achieve"
  },
  values: {
    key: "values",
    type: "string",
    description: "What the user considers important in life"
  },
  beliefs: {
    key: "beliefs",
    type: "string",
    description: "The user's core beliefs and worldview"
  },
  challenges: {
    key: "challenges",
    type: "string",
    description: "Difficulties or obstacles the user is facing"
  },
  life_story: {
    key: "life_story",
    type: "string",
    description: "A brief narrative of the user's life experiences"
  }
}

class UserProfileStore {
  private config: UserProfileConfigType = {
    name: null,
    location: null,
    age: null,
    gender: null,
    occupation: null,
    interests: null,
    goals: null,
    values: null,
    beliefs: null,
    challenges: null,
    life_story: null
  }

  public async init() {
    // Create directory if it doesn't exist
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true })
    }

    // Load config if it exists
    if (existsSync(CONFIG_PATH)) {
      try {
        const fileContent = readFileSync(CONFIG_PATH, "utf-8")
        const loadedConfig = JSON.parse(fileContent)
        this.config = this.validateConfig(loadedConfig)
      } catch (error) {
        console.error("Error loading user profile config:", error)
      }
    } else {
      // Create default config file
      await this.saveConfig()
    }

    return this
  }

  private validateConfig(config: any): UserProfileConfigType {
    const validatedConfig = { ...this.config }

    for (const key in AVAILABLE_USER_PROFILE_FIELDS) {
      const typedKey = key as keyof UserProfileConfigType
      if (config[typedKey] !== undefined) {
        validatedConfig[typedKey] = config[typedKey]
      }
    }

    return validatedConfig
  }

  public async saveConfig() {
    try {
      writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error("Error saving user profile config:", error)
    }
  }

  public async updateConfig(updates: Partial<UserProfileConfigType>) {
    this.config = { ...this.config, ...updates }
    await this.saveConfig()
  }

  public getConfig(): UserProfileConfigType {
    return { ...this.config }
  }

  public async clearConfig() {
    this.config = {
      name: null,
      location: null,
      age: null,
      gender: null,
      occupation: null,
      interests: null,
      goals: null,
      values: null,
      beliefs: null,
      challenges: null,
      life_story: null
    }
    await this.saveConfig()
  }
}

export const userProfileStore = new UserProfileStore()
