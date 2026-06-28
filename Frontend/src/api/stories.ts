import { api } from './axios'
import type { Story, CreateStoryRequest } from '@/types'

export const storiesApi = {
  getActiveStories: () =>
    api.get<Story[]>('/Stories/active').then((r) => r.data),

  createStory: (data: CreateStoryRequest) => {
    const formData = new FormData()
    formData.append('City', data.city)
    formData.append('Description', data.description)
    formData.append('MediaFile', data.mediaFile)
    return api.post<Story>('/Stories/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  viewStory: (storyId: string) =>
    api.post(`/Stories/${storyId}/view`).then(() => undefined),

  toggleLove: (storyId: string) =>
    api.post(`/Stories/${storyId}/love`).then((r) => Boolean(r.envelope?.isLoved)),

  deleteOwn: (storyId: string) =>
    api.delete(`/Stories/${storyId}`).then((r) => r.message ?? 'Story deleted'),
}

