import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { storage } from '@/utils/storage'

// The backend wraps every JSON response in this envelope.
export interface ApiEnvelope<T = unknown> {
  isSuccess: boolean
  message?: string
  data?: T
  // Some endpoints add ad-hoc fields next to data (e.g. bookingId, imageUrl, planId).
  [key: string]: unknown
}

// Augment AxiosResponse so callers can read envelope-level fields without losing types.
// Must match axios' real signature: AxiosResponse<T = any, D = any, H = {}>
declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface AxiosResponse<T = any, D = any, H = {}> {
    envelope?: ApiEnvelope<T>
    message?: string
    isSuccess?: boolean
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor unwraps the envelope:
//   { isSuccess, message, data? , ...extraFields }
// - response.data       -> envelope.data ?? envelope (so create endpoints with no `data` field still work)
// - response.envelope   -> the full envelope (lets callers read bookingId/imageUrl/etc.)
// - response.message    -> envelope.message
// - response.isSuccess  -> envelope.isSuccess
// Non-enveloped 2xx responses pass through unchanged.
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data
    if (body && typeof body === 'object' && typeof body.isSuccess !== 'undefined') {
      const envelope = body as ApiEnvelope
      if (!envelope.isSuccess) {
        return Promise.reject(new Error(envelope.message || 'Request failed'))
      }
      return {
        ...response,
        data: (envelope.data !== undefined ? envelope.data : envelope) as unknown,
        envelope,
        message: envelope.message,
        isSuccess: envelope.isSuccess,
      }
    }
    return response
  },
  (error: AxiosError<ApiEnvelope>) => {
    if (error.response?.status === 401) {
      const hadToken = !!storage.getToken()
      storage.clearAuth()
      // Only hard-redirect when the request was authenticated (expired/revoked session).
      // Anonymous requests to auth-guarded endpoints (e.g. public pages calling /api/places)
      // should just reject normally — not hijack the whole page.
      if (hadToken && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope | undefined
    return data?.message ?? error.message ?? 'An unexpected error occurred'
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

/** Returns true when the error is a 401 — used to silently skip toasts on public pages. */
export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}
