import { api } from './axios'
import type { TouristProfile, AiPlan, ManualPlan, UpdateTouristProfileRequest } from '@/types'
import type { RecommendationPlace } from '@/types';

export const touristsApi = {
  getMyProfile: () =>
    api.get<TouristProfile>('/Tourists/my-profile').then((r) => r.data),

  updateProfile: (data: UpdateTouristProfileRequest) =>
    api.put('/Tourists/Update-my-profile', data).then((r) => r.message ?? 'Profile updated'),

  updateProfileImage: (profileImage: File) => {
    const formData = new FormData()
    formData.append('profileImage', profileImage)
    return api.put('/Tourists/update-profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => (r.envelope?.imageUrl as string | undefined) ?? '')
  },

  getMyAiPlans: () =>
    api.get<AiPlan[]>('/Tourists/my-ai-plans').then((r) => r.data),

  getMyManualPlans: () =>
    api.get<ManualPlan[]>('/Tourists/my-manual-plans').then((r) => r.data),

  getRecommendations: () =>
    api.get<RecommendationPlace[]>('/Tourists/recommendations').then((r) => r.data),
}
