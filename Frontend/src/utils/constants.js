export const API_BASE = 'http://localhost:5008'

export const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

export const PLACE_TYPES = [
  { value: 'Monument',   label: 'Monuments',   icon: '🏛️' },
  { value: 'Museum',     label: 'Museums',      icon: '🏺' },
  { value: 'Temple',     label: 'Temples',      icon: '⛩️' },
  { value: 'Pyramid',    label: 'Pyramids',     icon: '🔺' },
  { value: 'Beach',      label: 'Beaches',      icon: '🏖️' },
  { value: 'Desert',     label: 'Desert',       icon: '🏜️' },
  { value: 'River',      label: 'Nile & Rivers', icon: '🌊' },
  { value: 'City',       label: 'Cities',       icon: '🌆' },
  { value: 'Market',     label: 'Markets',      icon: '🛒' },
  { value: 'Nature',     label: 'Nature',       icon: '🌿' },
]

export const BOOKING_STATES = {
  Pending:   { label: 'Pending',   color: 'text-yellow-400',  bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  Accepted:  { label: 'Accepted',  color: 'text-blue-400',    bg: 'bg-blue-400/10',   border: 'border-blue-400/20' },
  Completed: { label: 'Completed', color: 'text-green-400',   bg: 'bg-green-400/10',  border: 'border-green-400/20' },
  Cancelled: { label: 'Cancelled', color: 'text-red-400',     bg: 'bg-red-400/10',    border: 'border-red-400/20' },
  Rejected:  { label: 'Rejected',  color: 'text-orange-400',  bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
}
