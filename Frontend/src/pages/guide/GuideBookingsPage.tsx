import { useCallback, useEffect, useState } from 'react'
import { Calendar, Check, X, MessageCircle, CheckCircle } from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, ListSkeleton, Tabs, useToast } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { Link } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import type { GuideBooking } from '@/types'

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'accepted':
      return <Badge variant="primary">Accepted</Badge>
    case 'completed':
      return <Badge variant="success">Completed</Badge>
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export function GuideBookingsPage() {
  const [tab, setTab] = useState('pending')
  const [pendingBookings, setPendingBookings] = useState<GuideBooking[]>([])
  const [historyBookings, setHistoryBookings] = useState<GuideBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [completeTarget, setCompleteTarget] = useState<string | null>(null)
  const { showToast } = useToast()
  const { lastBookingRequested, lastBookingStateChanged, refreshPendingBookings } = useNotifications()

  const loadBookings = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pending, history] = await Promise.all([
        bookingsApi.getPendingBookings(),
        bookingsApi.getGuideHistory(),
      ])
      setPendingBookings(pending || [])
      setHistoryBookings(history || [])
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  // Re-sync the list whenever a real-time booking event lands.
  useEffect(() => {
    if (!lastBookingRequested && !lastBookingStateChanged) return
    loadBookings()
  }, [lastBookingRequested, lastBookingStateChanged, loadBookings])

  const handleAccept = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await bookingsApi.acceptBooking(bookingId)
      showToast('Booking accepted successfully!', 'success')
      await loadBookings()
      await refreshPendingBookings()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = (bookingId: string) => setRejectTarget(bookingId)

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    const id = rejectTarget
    setRejectTarget(null)
    setActionLoading(id)
    try {
      await bookingsApi.rejectBooking(id)
      showToast('Booking rejected', 'success')
      await loadBookings()
      await refreshPendingBookings()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = (bookingId: string) => setCompleteTarget(bookingId)

  const handleConfirmComplete = async () => {
    if (!completeTarget) return
    const id = completeTarget
    setCompleteTarget(null)
    setActionLoading(id)
    try {
      await bookingsApi.completeBooking(id)
      showToast('Tour marked as completed!', 'success')
      await loadBookings()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const currentBookings = tab === 'pending' ? pendingBookings : historyBookings
  const pendingCount = pendingBookings.length

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Manage Bookings</h1>

      <Tabs
        tabs={[
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'history', label: 'Tour History' },
        ]}
        activeTab={tab}
        onChange={setTab}
        className="mb-6 max-w-md"
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : currentBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={tab === 'pending' ? 'No pending requests' : 'No completed tours'}
          description={
            tab === 'pending'
              ? 'When travelers request a tour, it will appear here.'
              : 'Completed tours will appear here.'
          }
        />
      ) : (
        <div className="grid gap-4">
          {currentBookings.map((booking) => (
            <Card key={booking.bookingId} className="p-5">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={booking.touristProfileUrl} name={booking.touristName} size="lg" />
                  <div>
                    <h3 className="font-semibold">{booking.touristName}</h3>
                    <p className="text-xs text-slate-500">{booking.touristCountry || 'International'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-amber-500">★</span>
                      <span className="text-xs text-slate-500">{booking.touristRate || 'New'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(booking.bookingState)}
                  <p className="text-sm font-semibold text-primary-600 mt-1">
                    {formatCurrency(booking.totalPrice)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-night-800">
                <div>
                  <p className="text-xs text-slate-400">Plan</p>
                  <p className="text-sm font-medium">{booking.planName || 'Travel Plan'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Requested</p>
                  <p className="text-sm">{formatDateTime(booking.createdAt)}</p>
                </div>
              </div>

              {tab === 'pending' && booking.bookingState === 'Pending' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-night-800">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(booking.bookingId)}
                    isLoading={actionLoading === booking.bookingId}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReject(booking.bookingId)}
                    isLoading={actionLoading === booking.bookingId}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              )}

              {tab === 'history' && booking.bookingState === 'Accepted' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-night-800">
                  <Button
                    size="sm"
                    onClick={() => handleComplete(booking.bookingId)}
                    isLoading={actionLoading === booking.bookingId}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Mark as Completed
                  </Button>
                  <Link to={`/chat?bookingId=${booking.bookingId}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-1" /> Chat
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex justify-end mt-3">
                <Link to={`/guide/bookings/${booking.bookingId}`}>
                  <Button size="sm" variant="ghost">View Details →</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>

      <ConfirmDialog
        isOpen={rejectTarget !== null}
        title="Reject Booking"
        message="Are you sure you want to reject this booking? This action cannot be undone."
        confirmLabel="Reject"
        danger
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectTarget(null)}
      />
      <ConfirmDialog
        isOpen={completeTarget !== null}
        title="Complete Tour"
        message="Mark this tour as completed? Commission will be charged upon confirmation."
        confirmLabel="Complete"
        onConfirm={handleConfirmComplete}
        onCancel={() => setCompleteTarget(null)}
      />
    </>
  )
}
