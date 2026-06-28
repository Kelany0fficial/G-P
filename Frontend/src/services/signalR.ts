import * as signalR from '@microsoft/signalr'
import { storage } from '@/utils/storage'
import type { ChatMessage, Notification } from '@/types'

// ── Wire payloads ─────────────────────────────────────────────────────────────

interface ChatMessageDto {
  id: string
  senderId: string
  receiverId: string
  content: string
  sentAt: string
  isMine?: boolean // ignored — direction is derived from senderId === currentUser.id
}

export interface BookingRequestedEvent {
  bookingId: string
  touristId: string
  touristName: string
  planName: string
  totalPrice: number
  state: 'Pending'
  createdAt: string
}

export interface BookingStateChangedEvent {
  bookingId: string
  guideId?: string
  guideName?: string
  touristId?: string
  touristName?: string
  state: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled'
  changedAt: string
}

export interface NewChatMessageEvent {
  bookingId: string
  senderId: string
  content: string
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapToChatMessage = (dto: ChatMessageDto): ChatMessage => ({
  id: dto.id,
  senderId: dto.senderId,
  receiverId: dto.receiverId,
  content: dto.content,
  sentAt: dto.sentAt,
  isMine: false, // never trust server's isMine — compare senderId locally
})

type MessageHandler      = (msg: ChatMessage) => void
type NotificationHandler = (n: Notification) => void
type BookingRequestHandler = (e: BookingRequestedEvent) => void
type BookingStateHandler   = (e: BookingStateChangedEvent) => void
type NewChatMessageHandler = (e: NewChatMessageEvent) => void

// ── Service class ─────────────────────────────────────────────────────────────

class SignalRService {
  private chatConnection: signalR.HubConnection | null = null
  private notifConnection: signalR.HubConnection | null = null

  /** Returns the backend origin without /api suffix. Used for direct WS URLs. */
  private origin(): string {
    return import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5008'
  }

  // ══════════════════════════════ CHAT ════════════════════════════════════════

  async connectChat(onMessage: MessageHandler, bookingId?: string): Promise<void> {
    // Already up — just join the room
    if (this.chatConnection?.state === signalR.HubConnectionState.Connected) {
      if (bookingId) await this.joinChatRoom(bookingId)
      return
    }

    // Tear down any stale instance BEFORE creating the new one
    if (this.chatConnection) {
      const old = this.chatConnection
      this.chatConnection = null
      old.stop().catch(() => {/* swallow */})
    }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${this.origin()}/chathub`, {
        accessTokenFactory: () => storage.getToken() ?? '',
        // Skip the HTTP /negotiate round-trip; go straight to WebSocket.
        // This eliminates "The connection was stopped during negotiation" (Strict Mode).
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build()

    conn.on('ReceiveMessage', (raw: unknown) => {
      onMessage(mapToChatMessage(raw as ChatMessageDto))
    })

    // Register BEFORE start() so we never miss a message
    this.chatConnection = conn

    try {
      await conn.start()
    } catch (err) {
      // If disconnectChat() was called while start() was pending,
      // this.chatConnection will be null — that disconnect was intentional.
      // Swallow the "Failed to start … before stop() was called" error.
      if (this.chatConnection !== conn) return
      this.chatConnection = null
      throw err
    }

    // A disconnect arrived while start() was awaited
    if (this.chatConnection !== conn) return

    if (bookingId) await this.joinChatRoom(bookingId)
  }

  async joinChatRoom(bookingId: string): Promise<void> {
    if (this.chatConnection?.state === signalR.HubConnectionState.Connected) {
      await this.chatConnection.invoke('JoinChatRoom', bookingId)
    }
  }

  async leaveChatRoom(bookingId: string): Promise<void> {
    if (this.chatConnection?.state === signalR.HubConnectionState.Connected) {
      await this.chatConnection.invoke('LeaveChatRoom', bookingId)
    }
  }

  disconnectChat(): void {
    // Set to null FIRST so any pending start() can detect intentional teardown.
    const conn = this.chatConnection
    this.chatConnection = null
    if (conn) conn.stop().catch(() => {/* swallow */})
  }

  // ══════════════════════════ NOTIFICATIONS / BOOKINGS ════════════════════════

  async connectNotifications(handlers: {
    onNotification: NotificationHandler
    onBookingRequested?: BookingRequestHandler
    onBookingStateChanged?: BookingStateHandler
    onNewChatMessage?: NewChatMessageHandler
  }): Promise<void> {
    if (this.notifConnection?.state === signalR.HubConnectionState.Connected) return

    if (this.notifConnection) {
      const old = this.notifConnection
      this.notifConnection = null
      old.stop().catch(() => {})
    }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${this.origin()}/notificationhub`, {
        accessTokenFactory: () => storage.getToken() ?? '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build()

    // ── ReceiveNotification ──────────────────────────────────────────────────
    conn.on('ReceiveNotification', (raw: unknown) => {
      let title    = 'Notification'
      let message  = ''
      let createdAt = new Date().toISOString()

      if (typeof raw === 'string') {
        message = raw
      } else if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>
        title   = typeof r.title   === 'string' ? r.title   : title
        message =
          typeof r.message === 'string' ? r.message
          : typeof r.body  === 'string' ? r.body
          : typeof r.text  === 'string' ? r.text
          : message
        if (typeof r.createdAt  === 'string') createdAt = r.createdAt
        else if (typeof r.timestamp === 'string') createdAt = r.timestamp
      }

      handlers.onNotification({
        id: crypto?.randomUUID?.() ?? `n-${Date.now()}`,
        title,
        message,
        createdAt,
        isRead: false,
      })
    })

    if (handlers.onBookingRequested) {
      conn.on('BookingRequested', (raw: unknown) => {
        handlers.onBookingRequested!(raw as BookingRequestedEvent)
      })
    }
    if (handlers.onBookingStateChanged) {
      conn.on('BookingStateChanged', (raw: unknown) => {
        handlers.onBookingStateChanged!(raw as BookingStateChangedEvent)
      })
    }

    if (handlers.onNewChatMessage) {
      conn.on('NewChatMessage', (raw: unknown) => {
        handlers.onNewChatMessage!(raw as NewChatMessageEvent)
      })
    }

    this.notifConnection = conn

    try {
      await conn.start()
    } catch (err) {
      if (this.notifConnection !== conn) return // intentionally disconnected
      this.notifConnection = null
      throw err
    }

    if (this.notifConnection !== conn) return
    // Server OnConnectedAsync auto-joins user:{id} + role groups — no invoke needed.
  }

  disconnectNotifications(): void {
    const conn = this.notifConnection
    this.notifConnection = null
    if (conn) conn.stop().catch(() => {})
  }
}

export const signalRService = new SignalRService()
