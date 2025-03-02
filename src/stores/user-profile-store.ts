import { homedir } from "os"
import { join } from "path"

const CONFIG_DIR = join(homedir(), ".config", "llm")
const CONFIG_PATH = join(CONFIG_DIR, "user-profile.json")

type UserProfileConfigType = {
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
