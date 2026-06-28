import { api } from './axios'
import type { ProcessPaymentRequest } from '@/types'

export interface PayDuesResult {
  outstandingBalance: number
  walletBalance: number
  message: string
}

export const paymentsApi = {
  payDues: (data: ProcessPaymentRequest) =>
    api.post('/Guides/pay-dues', data).then((r) => {
      const payload = (r.data ?? {}) as { outstandingBalance?: number; walletBalance?: number }
      const result: PayDuesResult = {
        outstandingBalance: payload.outstandingBalance ?? 0,
        walletBalance: payload.walletBalance ?? 0,
        message: r.message ?? 'Payment processed',
      }
      return result
    }),
}
