import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationsApi } from '@/api/notifications'
import { signalRService } from '@/services/signalR'
import { useAuth } from '@/context/AuthContext'
import { Button, EmptyState, ListSkeleton } from '@/components/ui'
import { formatDateTime } from '@/utils/format'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import type { Notification } from '@/types'
import { cn } from '@/utils/cn'

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuth()
  const { showToast } = useToast()

  const unreadCount = notifications.filter(n => !n.isRead).length

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await notificationsApi.getMyNotifications()
      setNotifications(data)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    // call asynchronously to avoid synchronous setState inside effect
    Promise.resolve().then(() => loadNotifications())
  }, [])

  // SignalR for real-time notifications
  useEffect(() => {
    if (!token) return

    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      showToast(`${notification.title}: ${notification.message}`, 'info')
    }

    signalRService.connectNotifications({ onNotification: handleNewNotification }).catch(console.error)

    return () => {
      signalRService.disconnectNotifications()
    }
  }, [token, showToast])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ))
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      showToast('All notifications marked as read', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Your notifications will appear here" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'p-4 rounded-xl border transition-colors cursor-pointer',
                n.isRead ? 'bg-white border-slate-100' : 'bg-primary-50 border-primary-100'
              )}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDateTime(n.createdAt)}</span>
              </div>
              {!n.isRead && (
                <div className="mt-2 text-right">
                  <span className="text-xs text-primary-500">New</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}