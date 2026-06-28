# أثر Ather — Egyptian Tourism Platform

Production-ready React frontend for connecting tourists with local tour guides in Egypt.

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4
- React Router v7
- Axios (`/api` base URL)
- SignalR (chat + notifications hubs)
- lucide-react icons
- RTL Arabic UI (Cairo font)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API requests proxy to `http://localhost:5000`.

## Project Structure

```
src/
├── api/           # Axios API modules
├── components/
│   ├── layout/    # Navbar, Footer, MobileNav, ProtectedRoute
│   ├── shared/    # GuideCard, PlaceCard, BookingCard, PlanCard
│   └── ui/        # Design system (Button, Input, Card, etc.)
├── context/       # Auth, Toast, Notifications
├── pages/
│   ├── auth/      # Login, Register, OTP, Forget Password
│   ├── shared/    # Landing, Explore, Guides, Chat, Profile
│   ├── tourist/   # Plans, Bookings
│   ├── guide/     # Profile, Bookings, Wallet, Stories
│   └── admin/     # Dashboard, Users, Moderation
├── routes/        # React Router config
├── services/      # SignalR
├── types/         # TypeScript interfaces
└── utils/         # cn, storage, format
```

## Roles & Routes

| Role | Key Routes |
|------|------------|
| Public | `/`, `/explore`, `/guides`, `/login`, `/register` |
| Tourist | `/plans/create`, `/plans`, `/bookings` |
| Guide | `/guide/profile`, `/guide/bookings`, `/guide/wallet`, `/guide/stories` |
| Admin | `/admin`, `/admin/users`, `/admin/pending-guides` |

## Authentication

JWT stored in `localStorage` (`ather_token`, `ather_user`). Protected routes use `ProtectedRoute` with optional role checks.

## SignalR Hubs

- `/hubs/chat` — real-time messaging (`ReceiveMessage`, `JoinBookingRoom`, `SendMessage`)
- `/hubs/notifications` — live notifications (`ReceiveNotification`)

## Design System

Primary color: `#0e7490` (primary-700). Mobile-first with bottom navigation for authenticated users.
