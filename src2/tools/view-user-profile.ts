import { tool } from "ai"
import { z } from "zod"
import { userProfileStore } from "../stores/user-profile-store"

export const viewUserProfileTool = tool({
  description:
    "View the user's profile information - if the user asks anything about their stored profile data, use this tool.",
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify(userProfileStore.getConfig(), null, 2)
  }
})
