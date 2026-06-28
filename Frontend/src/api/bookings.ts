import { api } from './axios'
import type { TouristBooking, GuideBooking, CreateBookingRequest } from '@/types'

export const bookingsApi = {
  // ----- Tourist -----
  createBooking: (data: CreateBookingRequest) =>
    api.post('/Bookings/request', data).then((r) => ({
      bookingId: (r.envelope?.bookingId as string | undefined) ?? '',
      message: r.message ?? 'Booking submitted',
    })),

  getMyBookings: () =>
    api.get<TouristBooking[]>('/Bookings/my-bookings').then((r) => r.data),

  cancelBooking: (bookingId: string) =>
    api.put(`/Bookings/${bookingId}/cancel`).then((r) => r.message ?? 'Cancelled'),

  // ----- Guide -----
  getPendingBookings: () =>
    api.get<GuideBooking[]>('/Bookings/guide/pending').then((r) => r.data),

  getGuideHistory: () =>
    api.get<GuideBooking[]>('/Bookings/guide/history').then((r) => r.data),

  acceptBooking: (bookingId: string) =>
    api.put(`/Bookings/guide/${bookingId}/accept`).then((r) => r.message ?? 'Accepted'),

  rejectBooking: (bookingId: string) =>
    api.put(`/Bookings/guide/${bookingId}/reject`).then((r) => r.message ?? 'Rejected'),

  completeBooking: (bookingId: string) =>
    api.put(`/Bookings/guide/${bookingId}/complete`).then((r) => r.message ?? 'Completed'),

  /** Plan itinerary for either participant of a booking. */
  getItinerary: (bookingId: string) =>
    api.get<{
      planName: string
      planType: 'AI' | 'Manual' | string
      totalDays: number
      startDate?: string | null
      manualPlanItems: { dayNumber: number; placeName: string; imageUrl?: string | null; placeId?: string | null }[]
      aiResponseJson?: string | null
    }>(`/Bookings/${bookingId}/MyBookingDetails`).then((r) => r.data),
}
