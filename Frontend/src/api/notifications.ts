import { api } from './axios'
import type { Notification } from '@/types'

export const notificationsApi = {
  getMyNotifications: () =>
    api.get<Notification[]>('/AdminNotifications/my-notifications').then((r) => r.data),

  markAsRead: (notificationId: string) =>
    api.patch<{ message: string }>(`/AdminNotifications/${notificationId}/mark-as-read`).then((r) => r.message),

  markAllAsRead: () =>
    api.patch<{ message: string }>('/AdminNotifications/mark-all-as-read').then((r) => r.message),
}