import { userProfileStore } from "../stores/user-profile-store"
import type { Tool } from "../utils/ai-utilities"

export const viewUserProfileTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "viewUserProfile",
      description:
        "View the user's profile information - if the user asks anything about their stored profile data, use this tool.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  handler: async () => {
    return {
      userProfile: userProfileStore.getConfig()
    }
  }
}
