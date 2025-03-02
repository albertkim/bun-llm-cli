import { AVAILABLE_USER_PROFILE_FIELDS, userProfileStore } from "../stores/user-profile-store"
import type { Tool } from "../utils/ai-utilities"

export const editUserProfileTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "editUserProfile",
      description: `Edit the user's profile information - use this when the user wants to update their profile details - possible fields are ${Object.keys(AVAILABLE_USER_PROFILE_FIELDS).join(", ")}`,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(AVAILABLE_USER_PROFILE_FIELDS).map(([key, config]) => [
            key,
            {
              type: config.type,
              description: config.description
            }
          ])
        ),
        required: []
      }
    }
  },
  handler: async (
    args: Partial<{
      name: string
      location: string
      age: number
      gender: string
      occupation: string
      interests: string
      goals: string
      values: string
      beliefs: string
      challenges: string
      life_story: string
    }>
  ) => {
    const updates = []

    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) {
        updates.push(`${key}: ${value}`)
      }
    }

    await userProfileStore.updateConfig(args)

    return {
      message: `Updated user profile: ${updates.join(", ")}`,
      userProfile: userProfileStore.getConfig()
    }
  }
}
