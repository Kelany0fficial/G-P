import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Send } from 'lucide-react'
import { chatApi } from '@/api/chat'
import { signalRService } from '@/services/signalR'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { Avatar, Button, EmptyState, Input, ListSkeleton } from '@/components/ui'
import { formatDateTime } from '@/utils/format'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import type { ChatMessage, TouristBooking, GuideBooking } from '@/types'
import { cn } from '@/utils/cn'
import { bookingsApi } from '@/api/bookings'

interface Conversation {
  bookingId: string
  otherUserName: string
  otherUserAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
}

export function ChatPage() {
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')
  const { hasRole, user } = useAuth()
  const { resetChatBadge } = useNotifications()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeBooking, setActiveBooking] = useState<string | null>(bookingIdParam)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Clear the unread chat badge as soon as the user opens this page
  useEffect(() => { resetChatBadge() }, [resetChatBadge])

  // Load eligible conversations from the user's bookings
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      try {
        let bookings: (TouristBooking | GuideBooking)[] = []

        if (hasRole('Tourist')) {
          const data = await bookingsApi.getMyBookings()
          bookings = data.filter((b) => b.state === 'Accepted' || b.state === 'Completed')
        } else if (hasRole('Guide')) {
          const [history, pending] = await Promise.all([
            bookingsApi.getGuideHistory(),
            bookingsApi.getPendingBookings(),
          ])
          bookings = [...history, ...pending].filter(
            (b) => b.bookingState === 'Accepted' || b.bookingState === 'Completed'
          )
        }

        const isTouristLocal = hasRole('Tourist')
        const convs: Conversation[] = bookings.map((b) => {
          const bookingId = 'bookingId' in b ? b.bookingId : ''
          const otherUserName =
            isTouristLocal && 'guideName' in b
              ? b.guideName
              : !isTouristLocal && 'touristName' in b
                ? (b as GuideBooking).touristName
                : ''
          const otherUserAvatar =
            isTouristLocal && 'guideProfileImage' in b
              ? (b as TouristBooking).guideProfileImage
              : !isTouristLocal && 'touristProfileUrl' in b
                ? (b as GuideBooking).touristProfileUrl
                : undefined
          return { bookingId, otherUserName, otherUserAvatar }
        })

        setConversations(convs)
      } catch (err) {
        console.error('Failed to load conversations', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [hasRole])

  useEffect(() => {
    if (bookingIdParam) setActiveBooking(bookingIdParam)
  }, [bookingIdParam])

  // Connect to chat and load history for the active conversation.
  // Dedup by id guards against the sender receiving their own message back via the
  // SignalR fan-out after we already pushed it locally from the POST response.
  useEffect(() => {
    if (!activeBooking) return

    let cancelled = false

    chatApi
      .getChatHistory(activeBooking)
      .then((history) => {
        if (!cancelled) setMessages(history)
      })
      .catch(() => {
        /* surfaced via toast elsewhere if needed */
      })

    signalRService
      .connectChat((incoming) => {
        if (cancelled || !incoming?.id) return
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
      }, activeBooking)
      .catch(() => {
        /* connection failure is non-fatal for read-only view */
      })

    return () => {
      cancelled = true
      signalRService.disconnectChat()
    }
  }, [activeBooking])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeBooking) return

    setIsSending(true)
    try {
      const sent = await chatApi.sendMessage(activeBooking, newMessage.trim())
      // Push locally; dedupe against SignalR echo that the sender also receives.
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
      setNewMessage('')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsSending(false)
    }
  }

  const activeConv = conversations.find((c) => c.bookingId === activeBooking)
  const myId = user?.id

  // Direction is computed ENTIRELY from senderId. We never read m.isMine because the
  // backend computes that field from the sender's perspective, which is wrong for the recipient.
  const decoratedMessages = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        ownedByMe: !!myId && m.senderId === myId,
      })),
    [messages, myId]
  )

  return (
    <div className="container-app h-[calc(100vh-8rem)] py-4">
      <div className="flex h-full overflow-hidden rounded-2xl border border-[color:var(--color-sand-100)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] dark:border-night-800">
        <aside
          className={cn(
            'flex w-full flex-col border-r border-[color:var(--color-sand-100)] dark:border-night-800 md:w-80',
            activeBooking && 'hidden md:flex'
          )}
        >
          <div className="border-b border-[color:var(--color-sand-100)] bg-gradient-to-r from-[color:var(--color-primary-50)] to-transparent p-4 font-semibold text-[var(--text-primary)] dark:border-night-800 dark:from-night-800">
            Messages
          </div>
          {isLoading ? (
            <ListSkeleton count={3} />
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">
              No conversations yet.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.bookingId}
                  type="button"
                  onClick={() => setActiveBooking(c.bookingId)}
                  className={cn(
                    'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[color:var(--color-sand-50)] dark:hover:bg-night-800',
                    activeBooking === c.bookingId &&
                      'bg-[color:var(--color-primary-50)] dark:bg-night-800'
                  )}
                >
                  <Avatar src={c.otherUserAvatar} name={c.otherUserName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.otherUserName}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {c.lastMessage || 'Start a conversation'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className={cn('flex flex-1 flex-col', !activeBooking && 'hidden md:flex')}>
          {activeBooking ? (
            <>
              <div className="flex items-center gap-3 border-b border-[color:var(--color-sand-100)] bg-gradient-to-r from-[color:var(--color-primary-50)] to-transparent p-4 dark:border-night-800 dark:from-night-800">
                <Avatar
                  src={activeConv?.otherUserAvatar}
                  name={activeConv?.otherUserName ?? 'Chat'}
                  size="md"
                />
                <span className="font-semibold">{activeConv?.otherUserName ?? 'Chat'}</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {decoratedMessages.map((msg) => {
                  const isMine = msg.ownedByMe
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex animate-fade-in', isMine ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                          isMine
                            ? 'rounded-br-sm bg-gradient-to-br from-[color:var(--color-primary-700)] to-[color:var(--color-primary-900)] text-white'
                            : 'rounded-bl-sm bg-[color:var(--color-sand-50)] text-slate-800 ring-1 ring-[color:var(--color-sand-100)] dark:bg-night-800 dark:text-slate-100 dark:ring-night-700'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={cn(
                            'mt-1 text-[10px]',
                            isMine ? 'text-primary-200' : 'text-slate-400 dark:text-slate-500'
                          )}
                        >
                          {formatDateTime(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex gap-2 border-t border-[color:var(--color-sand-100)] p-4 dark:border-night-800"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message…"
                  className="flex-1"
                />
                <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="Select a conversation"
              description="Choose a chat from the sidebar or start one from your bookings."
            />
          )}
        </div>
      </div>
    </div>
  )
}
