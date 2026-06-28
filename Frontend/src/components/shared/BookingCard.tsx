import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Coins } from 'lucide-react'
import { Avatar, Badge, Card } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { TouristBooking, GuideBooking } from '@/types'

interface BookingCardProps {
  booking: TouristBooking | GuideBooking
  viewAs?: 'tourist' | 'guide'
  detailPath?: string
}

// Map status strings to the semantic Badge variants in our system.
// Notice we never reach for raw colors — only the semantic ones.
type StatusVariant = 'warning' | 'primary' | 'success' | 'danger' | 'default'

const STATUS_META: Record<string, { variant: StatusVariant; label: string }> = {
  pending:   { variant: 'warning', label: 'Pending' },
  accepted:  { variant: 'primary', label: 'Accepted' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger',  label: 'Cancelled' },
  rejected:  { variant: 'danger',  label: 'Rejected'  },
}

function resolveStatus(raw?: string) {
  return STATUS_META[(raw ?? '').toLowerCase()] ?? { variant: 'default' as StatusVariant, label: raw || 'Unknown' }
}

export function BookingCard({ booking, viewAs = 'tourist', detailPath }: BookingCardProps) {
  const isTourist = viewAs === 'tourist'
  const bookingId = (booking as { bookingId?: string; id?: string }).bookingId ?? (booking as { id?: string }).id ?? ''
  const otherName  = isTourist ? (booking as TouristBooking).guideName   : (booking as GuideBooking).touristName
  const otherAvatar = isTourist ? (booking as TouristBooking).guideProfileImage : (booking as GuideBooking).touristProfileUrl
  const planName   = (booking as TouristBooking).planName  || (booking as GuideBooking).planName
  const totalPrice = (booking as TouristBooking).totalCost || (booking as GuideBooking).totalPrice
  const status     = (booking as { state?: string; bookingState?: string }).state
                  ?? (booking as { bookingState?: string }).bookingState
                  ?? 'Pending'
  const createdAt  = (booking as { bookingDate?: string; createdAt?: string }).bookingDate
                  ?? (booking as { createdAt?: string }).createdAt

  const meta = resolveStatus(status)
  const path = detailPath ?? `/bookings/${bookingId}`

  return (
    <Link to={path} className="block">
      <Card hover padding="md" className="group">
        <div className="flex items-center gap-4">
          <Avatar src={otherAvatar} name={otherName} size="lg" />

          <div className="min-w-0 flex-1">
            {/* Title row: name + status */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-bold text-app transition-colors group-hover:text-brand">
                {otherName}
              </h3>
              <Badge variant={meta.variant} className="shrink-0">
                {meta.label}
              </Badge>
            </div>

            {/* Subtitle */}
            <p className="mt-0.5 truncate text-sm text-secondary-app">
              {planName || 'Travel Plan'}
            </p>

            {/* Meta */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {createdAt ? formatDateTime(createdAt) : 'N/A'}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand">
                <Coins className="h-3.5 w-3.5" />
                {formatCurrency(totalPrice || 0)}
              </span>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-app" />
        </div>
      </Card>
    </Link>
  )
}
