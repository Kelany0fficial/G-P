import { api } from './axios'
import type { AiPlan, AiPlanDetails, ManualPlan, CreateAiPlanRequest, CreateManualPlanRequest } from '@/types'

export const plansApi = {
  // ----- AI Plans -----
  generateAiPlan: (data: CreateAiPlanRequest) =>
    api.post('/Plans/generate', data).then((r) => ({
      planId: (r.envelope?.planId as string | undefined) ?? '',
      message: r.message ?? 'Plan generated',
    })),

  getAiPlanDetails: (planId: string) =>
    api.get<AiPlanDetails>(`/Plans/ai-plan-details/${planId}`).then((r) => r.data),

  getMyAiPlans: () =>
    api.get<AiPlan[]>('/Tourists/my-ai-plans').then((r) => r.data),

  // ----- Manual Plans -----
  createManualPlan: (data: CreateManualPlanRequest) =>
    api.post('/Plans/manual-generate', data).then((r) => ({
      planId: (r.envelope?.planId as string | undefined) ?? '',
      message: r.message ?? 'Plan saved',
    })),

  getMyManualPlans: () =>
    api.get<ManualPlan[]>('/Tourists/my-manual-plans').then((r) => r.data),
}
