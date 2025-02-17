import { existsSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export const CONFIG_DIR = join(homedir(), ".config", "llm")
export const CONFIG_PATH = join(CONFIG_DIR, "config.json")

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

function validateConfig(config: Record<string, string | number>): ConfigType {
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

export async function getValidatedConfig(): Promise<ConfigType> {
  const existingConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
  return validateConfig(existingConfig)
}

// Update the config file with the new config
async function syncFullConfig(config: ConfigType) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export async function syncSingleConfig(key: keyof ConfigType, value: string) {
  const existingConfig = await getValidatedConfig()
  existingConfig[key] = value
  syncFullConfig(existingConfig)
  return existingConfig
}

export async function setUpAndGetConfig() {
  // Check the existing file
  let existingConfig: any = {}
  if (existsSync(CONFIG_PATH)) {
    existingConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
  }
  const validatedConfig = validateConfig(existingConfig)
  syncFullConfig(validatedConfig)

  return validatedConfig
}

export async function clearConfig() {
  if (existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2))
  }
}
