import { api } from './axios'
import type { AuthResponse } from '@/types'

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/Account/login', data).then((r) => r.data),

  registerTourist: (data: FormData) =>
    api.post('/Account/register-tourist', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => ({ message: r.message ?? 'Registered successfully' })),

  registerGuide: (data: FormData) =>
    api.post('/Account/register-guide', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => ({ message: r.message ?? 'Registered successfully' })),

  verifyEmail: (data: { email: string; otp: string }) =>
    api.post('/Account/verify-email', data).then((r) => ({ message: r.message ?? 'Verified' })),

  resendActivationOtp: (email: string) =>
    api.post('/Account/resend-activation-otp', { email }).then((r) => ({ message: r.message ?? 'OTP sent' })),

  forgetPassword: (data: { email: string }) =>
    api.post('/Account/forget-password', data).then((r) => ({ message: r.message ?? 'Reset code sent if account exists' })),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/Account/reset-password', data).then((r) => ({ message: r.message ?? 'Password updated' })),
}
