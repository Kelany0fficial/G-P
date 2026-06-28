import { api } from './axios'
import type { ChatMessage } from '@/types'

export const chatApi = {
  getChatHistory: (bookingId: string) =>
    api.get<ChatMessage[]>(`/Chat/${bookingId}/history`).then((r) => r.data),

  sendMessage: (bookingId: string, content: string) =>
    // ASP.NET [FromBody] string needs a JSON-encoded body: "hello" not hello.
    // axios.post(url, rawString) sends the string without JSON quotes → 400.
    // JSON.stringify wraps it in quotes so the binding succeeds.
    api
      .post<ChatMessage>(`/Chat/${bookingId}/send`, JSON.stringify(content))
      .then((r) => r.data),
}