import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Compass,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { Avatar, ThemeToggle } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { absoluteMediaUrl } from '@/utils/media'
import { cn } from '@/utils/cn'

/** Red counter bubble on top-right of an icon */
function CounterBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--bg-surface)]',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function Navbar() {
  const { isAuthenticated, user, logout, hasRole } = useAuth()
  const { unreadCount, pendingBookingsCount, unreadChatCount } = useNotifications()
  const navigate                                     = useNavigate()
  const { pathname }                                 = useLocation()
  const [mobileOpen, setMobileOpen]                  = useState(false)

  /* Build the nav link list based on role */
  const links: { to: string; label: string; badge?: number }[] = [
    { to: '/explore', label: 'Explore' },
    { to: '/guides',  label: 'Guides'  },
  ]
  if (isAuthenticated && !hasRole('Admin')) {
    links.push({ to: '/stories', label: 'Stories' })
  }
  if (hasRole('Tourist')) {
    links.push(
      { to: '/plans/create', label: 'Plan Trip' },
      { to: '/bookings',     label: 'My Bookings', badge: pendingBookingsCount },
    )
  }
  if (hasRole('Guide')) {
    links.push({ to: '/guide/bookings', label: 'My Bookings', badge: pendingBookingsCount })
  }
  if (hasRole('Admin')) {
    links.push({ to: '/admin', label: 'Dashboard' })
  }

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to)

  const userName  = user?.userName || 'User'
  const avatarUrl = absoluteMediaUrl(user?.profileImageUrl)

  return (
    <header className="sticky top-0 z-40 border-b border-sand-100 bg-[var(--bg-surface)]/90 backdrop-blur-xl dark:border-night-800">
      {/* Pharaonic gold accent at the very top of the navbar */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-400/55 to-transparent" />

      <div className="container-app">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Brand ── */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 outline-none">
            <Logo />
            {/* <span className="hidden text-xl font-black tracking-tight text-[var(--text-primary)] sm:block">
              Ather
            </span> */}
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((link) => {
              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'text-[var(--text-secondary)] hover:bg-sand-50 hover:text-[var(--text-primary)] dark:hover:bg-night-800',
                  )}
                >
                  {link.label}
                  {/* Pending-bookings badge */}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                  {/* Gold underline for active link */}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-gold-400 to-gold-500" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  aria-label="Notifications"
                  className="relative rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-sand-50 hover:text-[var(--text-primary)] dark:hover:bg-night-800"
                >
                  <Bell className="h-5 w-5" />
                  <CounterBadge count={unreadCount} />
                </Link>

                {/* Chat */}
                <Link
                  to="/chat"
                  aria-label="Chat"
                  className="relative hidden rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-sand-50 hover:text-[var(--text-primary)] dark:hover:bg-night-800 sm:block"
                >
                  <MessageCircle className="h-5 w-5" />
                  <CounterBadge count={unreadChatCount} />
                </Link>

                {/* Profile / avatar */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-sand-50 dark:hover:bg-night-800"
                >
                  <Avatar src={avatarUrl} name={userName} size="sm" />
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[var(--text-primary)] lg:block">
                    {userName}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="hidden rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-rose-600 dark:hover:bg-red-500/10 sm:block"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/40"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-br from-primary-700 to-primary-900 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-primary-900/30 ring-1 ring-primary-800/30 transition-all hover:shadow-md hover:shadow-primary-900/40"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Hamburger (mobile) */}
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg p-2 transition-colors hover:bg-sand-50 dark:hover:bg-night-800 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileOpen && (
          <nav className="space-y-1 border-t border-sand-100 py-4 dark:border-night-800 md:hidden">
            {links.map((link) => {
              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'text-[var(--text-secondary)] hover:bg-sand-50 hover:text-[var(--text-primary)] dark:hover:bg-night-800',
                  )}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => { handleLogout(); setMobileOpen(false) }}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Logout
              </button>
            )}

            {/* Quick-link chips */}
            <div className="flex flex-wrap items-center gap-2 px-3 pt-2">
              {isAuthenticated && hasRole('Admin') && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <LayoutDashboard className="h-4 w-4" /> Admin
                </Link>
              )}
              {isAuthenticated && hasRole('Tourist') && (
                <Link to="/explore" onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <Compass className="h-4 w-4" /> Explore
                </Link>
              )}
              {isAuthenticated && hasRole('Tourist') && (
                <Link to="/plans/create" onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <Map className="h-4 w-4" /> Plan
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <User className="h-4 w-4" /> Profile
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
