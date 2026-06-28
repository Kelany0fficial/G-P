import { api } from './axios'
import type {
  AdminStats,
  PendingGuide,
  ReviewModeration,
  StoryModeration,
  UserManagement,
} from '@/types'

export const adminApi = {
  // Dashboard
  getStats: () =>
    api.get<AdminStats>('/Admin/dashboard-stats').then((r) => r.data),

  // Guides Management
  getPendingGuides: () =>
    api.get<PendingGuide[]>('/Admin/pending-guides').then((r) => r.data),

  approveGuide: (guideId: string) =>
    api.put<{ message: string }>(`/Admin/guides/${guideId}/approve`).then((r) => r.message),

  rejectGuide: (guideId: string) =>
    api.delete<{ message: string }>(`/Admin/guides/${guideId}/reject`).then((r) => r.message),

  // Reviews Management
  getPendingReviews: () =>
    api.get<ReviewModeration[]>('/Admin/reviews').then((r) => r.data),

  deleteReview: (reviewId: string) =>
    api.delete<{ message: string }>(`/Admin/reviews/${reviewId}`).then((r) => r.message),

  // Stories Management
  getPendingStories: () =>
    api.get<StoryModeration[]>('/Admin/stories').then((r) => r.data),

  deleteStory: (storyId: string) =>
    api.delete<{ message: string }>(`/Admin/stories/${storyId}`).then((r) => r.message),

  // Users Management
  getUsers: () =>
    api.get<UserManagement[]>('/Admin/users').then((r) => r.data),

  toggleUserStatus: (userId: string) =>
    api.patch<{ message: string }>(`/Admin/users/${userId}/toggle-ban`).then((r) => r.message),

  deleteUser: (userId: string) =>
    api.delete<{ message: string }>(`/Admin/users/${userId}/delete`).then((r) => r.message),

  // Notifications
  sendBroadcastNotification: (data: { title: string; message: string; target: 0 | 1 | 2 }) =>
    api.post<{ message: string }>('/AdminNotifications/send', data).then((r) => r.message),
}