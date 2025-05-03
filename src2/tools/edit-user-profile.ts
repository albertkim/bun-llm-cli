import { tool } from "ai"
import { z } from "zod"
import { AVAILABLE_USER_PROFILE_FIELDS, userProfileStore } from "../stores/user-profile-store"

export const editUserProfileTool = tool({
  description: `Edit the user's profile information - use this when the user wants to update their profile details - possible fields are ${Object.keys(AVAILABLE_USER_PROFILE_FIELDS).join(", ")}`,
  parameters: z.object({
    name: z.string().optional(),
    location: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    interests: z.string().optional(),
    goals: z.string().optional(),
    values: z.string().optional(),
    beliefs: z.string().optional(),
    challenges: z.string().optional(),
    life_story: z.string().optional()
  }),
  execute: async (args) => {
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
})
