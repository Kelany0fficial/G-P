import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import { LandingPage } from '@/pages/shared/LandingPage'
import { ExplorePage } from '@/pages/shared/ExplorePage'
import { PlaceDetailPage } from '@/pages/shared/PlaceDetailPage'
import { GuidesPage } from '@/pages/shared/GuidesPage'
import { GuideDetailPage } from '@/pages/shared/GuideDetailPage'
import { ProfilePage } from '@/pages/shared/ProfilePage'
import { NotificationsPage } from '@/pages/shared/NotificationsPage'
import { ChatPage } from '@/pages/shared/ChatPage'
import { StoriesPage } from '@/pages/shared/StoriesPage'

import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { VerifyOtpPage } from '@/pages/auth/VerifyOtpPage'
import { ForgetPasswordPage } from '@/pages/auth/ForgetPasswordPage'

import { CreatePlanPage } from '@/pages/tourist/CreatePlanPage'
import { MyPlansTabsPage } from '@/pages/tourist/MyPlansPage'
import { PlanDetailPage } from '@/pages/tourist/PlanDetailPage'
import { MyBookingsPage } from '@/pages/tourist/MyBookingsPage'
import { CreateBookingPage } from '@/pages/tourist/CreateBookingPage'
import { BookingDetailPage } from '@/pages/tourist/BookingDetailPage'

import { GuideProfilePage } from '@/pages/guide/GuideProfilePage'
import { GuideBookingsPage } from '@/pages/guide/GuideBookingsPage'
import { GuideWalletPage } from '@/pages/guide/GuideWalletPage'
import { GuideStoriesPage } from '@/pages/guide/GuideStoriesPage'

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminPendingGuidesPage } from '@/pages/admin/AdminPendingGuidesPage'
import { AdminPlacesPage } from '@/pages/admin/AdminPlacesPage'
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage'
import { AdminStoriesPage } from '@/pages/admin/AdminStoriesPage'
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'explore/:id', element: <PlaceDetailPage /> },
      { path: 'explore/ai/:aiId', element: <PlaceDetailPage /> },
      { path: 'guides', element: <GuidesPage /> },
      { path: 'guides/:id', element: <GuideDetailPage /> },
      {
        path: 'stories',
        element: (
          <ProtectedRoute>
            <StoriesPage />
          </ProtectedRoute>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-otp', element: <VerifyOtpPage /> },
      { path: 'forget-password', element: <ForgetPasswordPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'plans/create',
        element: (
          <ProtectedRoute roles={['Tourist']}>
            <CreatePlanPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'plans',
        element: (
          <ProtectedRoute roles={['Tourist']}>
            <MyPlansTabsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'plans/:id',
        element: (
          <ProtectedRoute roles={['Tourist']}>
            <PlanDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings',
        element: (
          <ProtectedRoute roles={['Tourist']}>
            <MyBookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/create',
        element: (
          <ProtectedRoute roles={['Tourist']}>
            <CreateBookingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <ProtectedRoute roles={['Tourist']}>
            <BookingDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'guide/profile',
        element: (
          <ProtectedRoute roles={['Guide']}>
            <GuideProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'guide/bookings',
        element: (
          <ProtectedRoute roles={['Guide']}>
            <GuideBookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'guide/bookings/:id',
        element: (
          <ProtectedRoute roles={['Guide']}>
            <BookingDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'guide/wallet',
        element: (
          <ProtectedRoute roles={['Guide']}>
            <GuideWalletPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'guide/stories',
        element: (
          <ProtectedRoute roles={['Guide']}>
            <GuideStoriesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['Admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'pending-guides', element: <AdminPendingGuidesPage /> },
      { path: 'places', element: <AdminPlacesPage /> },
      { path: 'reviews', element: <AdminReviewsPage /> },
      { path: 'stories', element: <AdminStoriesPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])