// ============ Auth Types ============
export type UserRole = 'Tourist' | 'Guide' | 'Admin'

export interface User {
  id: string
  email: string
  userName: string
  profileImageUrl?: string
  role: UserRole
  age?: number
  country?: string
  gender?: 'Male' | 'Female'
}

export interface AuthResponse {
  userId: string
  userName: string
  email: string
  role: UserRole
  profileImageUrl?: string
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterTouristRequest {
  userName: string
  email: string
  password: string
  age: number
  country: string
  gender: number
  language: string
  urlProfile?: File
}

export interface RegisterGuideRequest {
  userName: string
  fullName: string
  email: string
  password: string
  age: number
  country: string
  gender: number
  language: string
  priceOfDay: number
  bio: string
  nationalIdImage: File
  profileImageFile?: File
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ForgetPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

// ============ Place Types ============
export interface Place {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  mainImageUrl?: string
  city?: string
  ticketPrice: number
  idFromModel: number
  averageRate?: number
}

export interface PlaceDetails extends Place {
  description?: string
  affiliateLink?: string
  openingHours?: string
  averageRate: number
  reviews: PlaceReview[]
  userPhotos: UserPhoto[]
  // mirror of `idFromModel` on the base — kept for type-narrowing in AI flows
  idFromModel: number
}

export interface PlaceReview {
  touristName: string
  rate: number
  comment: string
  createdAt: string
}

export interface UserPhoto {
  id: string
  userName: string
  photoUrl: string
  uploadedAt: string
}

// ============ Guide Types ============
export interface Guide {
  guideId: string
  name: string
  profileImageUrl?: string
  priceOfDay: number
  language: string
  languages?: string[]
  rate: number
}

export interface GuideDetails extends Guide {
  bio: string
  completedToursCount: number
  reviews: GuideReview[]
  walletBalance?: number
}

export interface GuideReview {
  touristName: string
  rate: number
  comment: string
}

export interface GuideWallet {
  outstandingBalance: number
  walletBalance: number
  completedTours: number
  cancellationStrikes: number
  isSuspended: boolean
}

// ============ Plan Types ============
export interface AiPlan {
  id: string
  name: string
  countDay: number
  budget: number
  type: string
  createdAt: string
}

export interface AiPlanDetails extends AiPlan {
  planItinerary: AiPlanItem[]
}

export interface AiPlanItem {
  dayNumber: number
  placeId: number
  placeName: string
  description: string
  imageUrl: string
  ticketPrice: number
}

export interface ManualPlan {
  id: string
  name: string
  startDate: string
  createdAt: string
  places: ManualPlanItem[]
}

export interface ManualPlanItem {
  placeId: string
  placeName: string
  dayNumber: number
  imageUrl?: string
}

export interface CreateAiPlanRequest {
  name: string
  description: string
  countDay: number
  budget: number
  type: string
  governorate: string
}

export interface CreateManualPlanRequest {
  name: string
  startDate: string
  selectedPlaces: { placeId: string; dayNumber: number }[]
}

// ============ Booking Types ============
export type BookingStatus = 'Pending' | 'Accepted' | 'Completed' | 'Cancelled'

export interface TouristBooking {
  bookingId: string
  planName: string
  guideId: string
  guideName: string
  guideProfileImage?: string
  bookingDate: string
  state: BookingStatus
  totalCost: number
}

export interface GuideBooking {
  bookingId: string
  touristName: string
  touristCountry: string
  touristProfileUrl?: string
  touristRate: number
  totalPrice: number
  planName: string
  createdAt: string
  bookingState: BookingStatus
}

export interface CreateBookingRequest {
  guideId: string
  aiPlanId?: string
  manualPlanId?: string
}

// ============ Story Types ============
export interface Story {
  storyId: string
  userId: string
  userName: string
  userProfileImage?: string
  city: string
  description: string
  mediaUrl: string
  mediaType: 'Image' | 'Video'
  createdAt: string
  expiresAt: string
  viewsCount: number
  lovesCount: number
  isLovedByMe: boolean
}

export interface CreateStoryRequest {
  city: string
  description: string
  mediaFile: File
}

// ============ Review Types ============
export interface CreateBookingReviewRequest {
  bookingId: string
  rate: number
  comment: string
}

export interface CreatePlaceReviewRequest {
  placeId: string
  rate: number
  comment: string
}

export interface ReviewDisplay {
  reviewerName: string
  reviewerImageUrl?: string
  rate: number
  comment: string
  createdAt: string
}

// ============ Notification Types ============
export interface Notification {
  id: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
}

export interface SendNotificationRequest {
  title: string
  message: string
  target: 0 | 1 | 2
}

// ============ Chat Types ============
export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  sentAt: string
  isMine: boolean
}

// ============ Admin Types ============
export interface AdminStats {
  totalTourists: number
  totalGuides: number
  pendingGuides: number
  totalSystemRevenue: number
  totalOutstandingDebts: number
  totalCompletedBookings: number
  monthlyPerformance: MonthlyStats[]
  bookingStatusDistribution: StatusDistribution[]
  topRatedGuides: TopGuide[]
  topTouristCountries: CountryStat[]
  touristAgeDistribution: AgeDistribution
  genderDistribution: GenderStat[]
  topRequestedLanguages: LanguageStat[]
}

export interface MonthlyStats {
  monthName: string
  bookingsCount: number
  commission: number
}

export interface StatusDistribution {
  statusName: string
  count: number
}

export interface TopGuide {
  name: string
  rate: number
  earnings: number
}

export interface CountryStat {
  countryName: string
  count: number
}

export interface AgeDistribution {
  youth: number
  adults: number
  middleAged: number
  seniors: number
}

export interface GenderStat {
  gender: string
  count: number
}

export interface LanguageStat {
  language: string
  count: number
}

export interface PendingGuide {
  guideId: string
  userName: string
  email: string
  nationalIdImage: string
  language: string
  bio: string
  priceOfDay: number
}

export interface UserManagement {
  id: string
  fullName: string
  email: string
  role: string
  blocked: boolean
  profilePicture?: string
  createdAt?: string
}

export interface ReviewModeration {
  id: string
  authorName: string
  targetName: string
  rate: number
  comment: string
  createdAt: string
}

export interface StoryModeration {
  id: string
  guideName: string
  mediaUrl: string
  caption: string
  createdAt: string
}

// ============ Payment Types ============
export interface ProcessPaymentRequest {
  amount: number
  payMethod: string
}

// ============ Profile Types ============
export interface TouristProfile {
  touristId: string
  userName: string
  email: string
  country: string
  age: number
  gender: string
  language: string
  languages?: string[]
  rateT: number
  profileImageUrl?: string
}

export interface UpdateTouristProfileRequest {
  userName: string
  country: string
  language?: string
  languages?: string[]
  age: number
}

export interface UpdateGuideProfileRequest {
  bio: string
  language?: string
  languages?: string[]
  priceOfDay: number
}

export interface RecommendationPlace {
  place_id: number;
  name: string;
  category: string;
  image_url: string;
  score: number;
}