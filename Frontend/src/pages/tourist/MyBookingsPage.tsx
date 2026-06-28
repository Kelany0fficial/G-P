import { useCallback, useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import { BookingCard } from '@/components/shared/BookingCard'
import { EmptyState, ListSkeleton, Tabs } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import { useNotifications } from '@/context/NotificationContext'
import type { TouristBooking } from '@/types'

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<TouristBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const { showToast } = useToast()
  const { lastBookingStateChanged } = useNotifications()

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await bookingsApi.getMyBookings()
      setBookings(data)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    reload()
  }, [reload])

  // SignalR: refetch the list whenever a state change lands for any of my bookings.
  useEffect(() => {
    if (!lastBookingStateChanged) return
    reload()
  }, [lastBookingStateChanged, reload])

  const filteredBookings =
    activeFilter === 'all'
      ? bookings
      : bookings.filter((b) => b.state?.toLowerCase() === activeFilter.toLowerCase())

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">My Bookings</h1>

      <Tabs tabs={filters} activeTab={activeFilter} onChange={setActiveFilter} className="mb-6" />

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description="Book a guide for your next adventure."
          actionLabel="Browse Guides"
          onAction={() => (window.location.href = '/guides')}
        />
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((b) => (
            <BookingCard key={b.bookingId} booking={b} viewAs="tourist" />
          ))}
        </div>
      )}
    </div>
  )
}
