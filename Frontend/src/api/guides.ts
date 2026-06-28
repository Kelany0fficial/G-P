import { api } from './axios'
import type { Guide, GuideDetails, GuideWallet, UpdateGuideProfileRequest } from '@/types'

export const guidesApi = {
  getActiveGuides: () =>
    api.get<Guide[]>('/Guides/active').then((r) => r.data),

  getGuideById: (id: string) =>
    api.get<GuideDetails>(`/Guides/${id}`).then((r) => r.data),

  getMyProfile: () =>
    api.get<GuideDetails>('/Guides/my-profile').then((r) => r.data),

  updateProfile: (data: UpdateGuideProfileRequest) =>
    api.put('/Guides/Update-my-profile', data).then((r) => r.message ?? 'Profile updated'),

  updateProfileImage: (profileImage: File) => {
    const formData = new FormData()
    formData.append('profileImage', profileImage)
    return api.put('/Guides/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => (r.envelope?.imageUrl as string | undefined) ?? '')
  },

  getWallet: () =>
    api.get<GuideWallet>('/Guides/my-wallet').then((r) => r.data),
}
