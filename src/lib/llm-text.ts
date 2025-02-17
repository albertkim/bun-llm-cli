import { getClient } from "../utils/ai-utilities"

export async function llmText(prompt: string, provider: string, model: string, apiKey: string) {
  const client = getClient(provider, apiKey)
  const response = await client.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: prompt }]
  })
  return response.choices[0].message.content
}
