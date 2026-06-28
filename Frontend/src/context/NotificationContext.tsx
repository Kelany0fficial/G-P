// src/context/NotificationContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { notificationsApi } from '@/api/notifications'
import { bookingsApi } from '@/api/bookings'
import {
  signalRService,
  type BookingRequestedEvent,
  type BookingStateChangedEvent,
  type NewChatMessageEvent,
} from '@/services/signalR'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { playNotificationChime } from '@/utils/sound'
import type { Notification } from '@/types'

interface NotificationContextValue {
  // Notifications
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>

  // Real-time bookings (badge counters + last event for pages to react to)
  pendingBookingsCount: number
  refreshPendingBookings: () => Promise<void>
  lastBookingRequested?: BookingRequestedEvent
  lastBookingStateChanged?: BookingStateChangedEvent

  // Unread chat messages (increments when a message arrives while NOT on /chat)
  unreadChatCount: number
  resetChatBadge: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications]               = useState<Notification[]>([])
  const [isLoading, setIsLoading]                       = useState(true)
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount]           = useState(0)
  const [lastBookingRequested, setLastBookingRequested]       = useState<BookingRequestedEvent>()
  const [lastBookingStateChanged, setLastBookingStateChanged] = useState<BookingStateChangedEvent>()

  const { token, isAuthenticated, hasRole, user } = useAuth()
  const { showToast } = useToast()
  const hasInitialLoadRef = useRef(false)

  // ── Load historical notifications ────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const data = await notificationsApi.getMyNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setIsLoading(false)
      hasInitialLoadRef.current = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setPendingBookingsCount(0)
      setUnreadChatCount(0)
      hasInitialLoadRef.current = false
      return
    }
    loadNotifications()
  }, [isAuthenticated, loadNotifications])

  // ── Booking badge ─────────────────────────────────────────────────────────────
  const refreshPendingBookings = useCallback(async () => {
    if (!isAuthenticated) { setPendingBookingsCount(0); return }
    try {
      if (hasRole('Guide')) {
        const data = await bookingsApi.getPendingBookings()
        setPendingBookingsCount(data.length)
      } else if (hasRole('Tourist')) {
        const data = await bookingsApi.getMyBookings()
        setPendingBookingsCount(data.filter((b) => b.state === 'Pending').length)
      } else {
        setPendingBookingsCount(0)
      }
    } catch { /* soft-fail */ }
  }, [isAuthenticated, hasRole])

  useEffect(() => { refreshPendingBookings() }, [refreshPendingBookings])

  // ── Chat badge reset (called by ChatPage on mount) ────────────────────────────
  const resetChatBadge = useCallback(() => setUnreadChatCount(0), [])

  // ── SignalR: all real-time events ─────────────────────────────────────────────
  useEffect(() => {
    if (!token || !isAuthenticated) return

    // Admin notification → toast + chime
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      try { playNotificationChime() } catch { /* ignore */ }
      showToast(
        notification.title
          ? `${notification.title}: ${notification.message}`
          : notification.message,
        'info'
      )
    }

    // Guide receives new booking request
    const handleBookingRequested = (event: BookingRequestedEvent) => {
      setLastBookingRequested(event)
      if (hasRole('Guide')) {
        setPendingBookingsCount((c) => c + 1)
        try { playNotificationChime() } catch { /* ignore */ }
        showToast(
          `${event.touristName} requested a tour for "${event.planName}".`,
          'info'
        )
      }
    }

    // Booking state changed (accept / reject / complete / cancel)
    const handleBookingStateChanged = (event: BookingStateChangedEvent) => {
      setLastBookingStateChanged(event)
      const headline =
        event.state === 'Accepted'   ? `${event.guideName ?? 'Your guide'} accepted your booking.`
        : event.state === 'Cancelled'
          ? (event.touristName
              ? `${event.touristName} cancelled the booking.`
              : `${event.guideName ?? 'Your guide'} rejected your booking.`)
          : event.state === 'Completed'
            ? `Your tour with ${event.guideName ?? 'your guide'} is now completed.`
            : `Booking status updated to ${event.state}.`

      try { playNotificationChime() } catch { /* ignore */ }
      showToast(headline, event.state === 'Cancelled' ? 'error' : 'success')
      refreshPendingBookings()
    }

    // New chat message arrives while user is NOT on the chat page
    const handleNewChatMessage = (event: NewChatMessageEvent) => {
      const onChatPage = window.location.pathname.startsWith('/chat')
      if (onChatPage) return // user sees it in real-time — no badge needed
      setUnreadChatCount((c) => c + 1)
      try { playNotificationChime() } catch { /* ignore */ }
      const preview = event.content.length > 50 ? `${event.content.slice(0, 50)}…` : event.content
      showToast(`💬 New message: ${preview}`, 'info')
    }

    signalRService
      .connectNotifications({
        onNotification:       handleNewNotification,
        onBookingRequested:   handleBookingRequested,
        onBookingStateChanged: handleBookingStateChanged,
        onNewChatMessage:     handleNewChatMessage,
      })
      .catch(console.error)

    return () => { signalRService.disconnectNotifications() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, user?.id])

  // ── Mark as read helpers ──────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (e) { console.error('Failed to mark as read', e) }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) { console.error('Failed to mark all as read', e) }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications, unreadCount, isLoading, markAsRead, markAllAsRead,
      pendingBookingsCount, refreshPendingBookings,
      lastBookingRequested, lastBookingStateChanged,
      unreadChatCount, resetChatBadge,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, unreadCount, isLoading, pendingBookingsCount,
     lastBookingRequested, lastBookingStateChanged, unreadChatCount]
  )

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
