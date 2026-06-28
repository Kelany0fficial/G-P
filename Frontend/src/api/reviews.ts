import { api } from './axios'
import type { CreateBookingReviewRequest, CreatePlaceReviewRequest, ReviewDisplay } from '@/types'

export const reviewsApi = {
  addBookingReview: (data: CreateBookingReviewRequest) =>
    api.post<{ message: string }>('/Reviews/booking', data).then((r) => r.message),

  addPlaceReview: (data: CreatePlaceReviewRequest) =>
    api.post<{ message: string }>('/Reviews/place', data).then((r) => r.message),

  getGuideReviews: (guideId: string) =>
    api.get<ReviewDisplay[]>(`/Reviews/guide/${guideId}`).then((r) => r.data),

  getTouristReviews: (touristId: string) =>
    api.get<ReviewDisplay[]>(`/Reviews/tourist/${touristId}`).then((r) => r.data),
}