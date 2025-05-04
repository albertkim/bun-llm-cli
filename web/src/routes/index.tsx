import { useChat } from "@ai-sdk/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: App
})

function App() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "http://localhost:3001/api/chat",
    streamProtocol: "text",
    onError: (error) => {
      console.error("Error in chat:", error)
    }
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Bun LLM</h1>

        <div className="mb-4 border border-gray-700 rounded-lg p-4 h-[60vh] overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-3 p-3 rounded-lg ${
                message.role === "user" ? "bg-blue-800 ml-auto max-w-[80%]" : "bg-gray-700 mr-auto max-w-[80%]"
              }`}
            >
              <p>{message.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            name="content"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-grow p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
