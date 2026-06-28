// src/api/aiGuide.ts
import { api } from './axios'

export interface AiGuideResponse {
  monument?: string
  text: string
  audio_url?: string
  audioUrl?: string
  latency_seconds?: number
}

const normalizeAiGuideResponse = (data: string | AiGuideResponse) => {
  if (typeof data === 'string') return data

  if (data && typeof data === 'object' && typeof data.text === 'string') {
    return data.text
  }

  return 'لا يوجد رد.'
}

export const aiGuideApi = {
  /**
   * POST /api/AiChatModel
   * يرسل صورة (أو صوت) مع اللغة، ويرجع النص من الـ AI
   */
  analyzeImage: (file: File, lang = 'ar') => {
    const form = new FormData()
    form.append('file', file)

    return api
      .post<string | AiGuideResponse>(`/AiChatModel?lang=${lang}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => normalizeAiGuideResponse(r.data))
  },
}