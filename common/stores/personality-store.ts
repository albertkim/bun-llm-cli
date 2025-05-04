import { homedir } from "os"
import { join } from "path"

const CONFIG_DIR = join(homedir(), ".config", "llm")
const CONFIG_PATH = join(CONFIG_DIR, "personality.json")

type PersonalityConfigType = {
  name: string | null
  humour: number | null
  empathy: number | null
  intelligence: number | null
  authority: number | null
}

export const AVAILABLE_PERSONALITY_FIELDS: Record<
  keyof PersonalityConfigType,
  { key: keyof PersonalityConfigType; type: string; description: string }
> = {
  name: {
    key: "name",
    type: "string",
    description: "The name of the personality"
  },
  humour: {
    key: "humour",
    type: "number",
    description:
      "Humour level - how witty and sarcastic you are, similar to Jarvis from Iron Man or TARS from Interstellar vs being more formal"
  },
  empathy: {
    key: "empathy",
    type: "number",
    description: "Empathy level - how much you can understand and relate to others"
  },
  intelligence: {
    key: "intelligence",
    type: "number",
    description:
      "Intelligence level - how smart and analytical you are, maybe even cocky, like HAL from 2001: A Space Odyssey"
  },
  authority: {
    key: "authority",
    type: "number",
    description:
      "Authority level - how confident and assertive you are - if higher, should not be afraid to challenge the user and push them to do better like a parent would"
  }
}

function getValidatedPersonalityConfig(config: any): PersonalityConfigType {
  // Start with defaults
  const validatedConfig: PersonalityConfigType = {
    name: null,
    humour: null,
    empathy: null,
    intelligence: null,
    authority: null
  }

  for (const key in AVAILABLE_PERSONALITY_FIELDS) {
    if (key === "name") {
      validatedConfig[key] = config[key] as string
    } else if (key === "humour") {
      validatedConfig[key] = config[key] as number
    } else if (key === "empathy") {
      validatedConfig[key] = config[key] as number
    } else if (key === "intelligence") {
      validatedConfig[key] = config[key] as number
    } else if (key === "authority") {
      validatedConfig[key] = config[key] as number
    }
  }

  return validatedConfig
}

class PersonalityStore {
  public isInitialized: boolean = false
  public personalityConfig: PersonalityConfigType

  constructor() {
    this.personalityConfig = getValidatedPersonalityConfig({})
  }

  public async init() {
    const configFile = Bun.file(CONFIG_PATH)
    let fileExists = await configFile.exists()
    let isValidJSON = true

    try {
      JSON.parse(await configFile.text())
    } catch (error) {
      isValidJSON = false
    }

    let existingConfig: any = {}
    if (fileExists && isValidJSON) {
      existingConfig = JSON.parse(await configFile.text())
    }

    const validatedConfig = getValidatedPersonalityConfig(existingConfig)
    this.personalityConfig = validatedConfig
    await this.syncConfig()
    this.isInitialized = true
  }

  private async syncConfig() {
    await Bun.write(CONFIG_PATH, JSON.stringify(this.personalityConfig, null, 2))
  }

  public async getConfig() {
    return this.personalityConfig
  }

  public async syncSingleConfig(key: keyof PersonalityConfigType, value: number | string) {
    if (key === "name") {
      this.personalityConfig[key] = value as string
    } else if (key === "humour") {
      this.personalityConfig[key] = value as number
    } else if (key === "empathy") {
      this.personalityConfig[key] = value as number
    } else if (key === "intelligence") {
      this.personalityConfig[key] = value as number
    } else if (key === "authority") {
      this.personalityConfig[key] = value as number
    }
    await this.syncConfig()
  }

  public async clearConfig() {
    await Bun.file(CONFIG_PATH).delete()
    await this.init()
  }
}

export const personalityStore = new PersonalityStore()
