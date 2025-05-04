import { homedir } from "os"
import { join } from "path"

const CONFIG_DIR = join(homedir(), ".config", "llm")
const CONFIG_PATH = join(CONFIG_DIR, "config.json")

type ConfigType = {
  google_ai_api_key: string | null
  google_ai_default_text_model: string | null
  openai_api_key: string | null
  openai_default_text_model: string | null
  anthropic_api_key: string | null
  anthropic_default_text_model: string | null
}

const expectedConfig: Record<string, { key: keyof ConfigType; type: string; description: string }> = {
  google_ai_api_key: {
    key: "google_ai_api_key",
    type: "string",
    description: "The API key for the Google AI Studio"
  },
  google_ai_default_text_model: {
    key: "google_ai_default_text_model",
    type: "string",
    description: "The default text model for the Google AI Studio"
  },
  openai_api_key: {
    key: "openai_api_key",
    type: "string",
    description: "The API key for the OpenAI"
  },
  openai_default_text_model: {
    key: "openai_default_text_model",
    type: "string",
    description: "The default text model for the OpenAI"
  },
  anthropic_api_key: {
    key: "anthropic_api_key",
    type: "string",
    description: "The API key for the Anthropic"
  },
  anthropic_default_text_model: {
    key: "anthropic_default_text_model",
    type: "string",
    description: "The default text model for the Anthropic"
  }
}

function getValidatedConfig(config: Record<string, string | number>): ConfigType {
  // Start with defaults
  const validatedConfig: ConfigType = {
    google_ai_api_key: null,
    google_ai_default_text_model: null,
    openai_api_key: null,
    openai_default_text_model: null,
    anthropic_api_key: null,
    anthropic_default_text_model: null
  }

  for (const key in expectedConfig) {
    if (config[key] === undefined) {
      validatedConfig[expectedConfig[key].key] = null
    } else {
      validatedConfig[expectedConfig[key].key] = config[key] as string
    }
  }

  return validatedConfig
}

class ConfigStore {
  public isInitialized: boolean = false
  public config: ConfigType
  public configDir: string = CONFIG_DIR
  public configPath: string = CONFIG_PATH

  constructor() {
    // Initialize the config with empty defaults
    // The program entry point should call initializeConfig() because it's async
    this.config = getValidatedConfig({})
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
    const validatedConfig = getValidatedConfig(existingConfig)
    this.config = validatedConfig
    this.syncConfig()
    this.isInitialized = true
  }

  // This should be called when the config is updated
  private async syncConfig() {
    await Bun.write(CONFIG_PATH, JSON.stringify(this.config, null, 2))
  }

  public async getConfig() {
    return this.config
  }

  public async syncSingleConfig(key: keyof ConfigType, value: string) {
    this.config[key] = value
    this.syncConfig()
  }

  public async clearConfig() {
    await Bun.file(CONFIG_PATH).delete()
    this.init()
  }
}

export const configStore = new ConfigStore()
