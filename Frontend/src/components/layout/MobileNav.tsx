import { Link, useLocation } from 'react-router-dom'
import { Calendar, Compass, Home, Map, MessageCircle, User, Wallet, Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  icon: typeof Home
  label: string
  badge?: number
}

export function MobileNav() {
  const { pathname }                       = useLocation()
  const { isAuthenticated, hasRole }       = useAuth()
  const { unreadCount, pendingBookingsCount, unreadChatCount } = useNotifications()

  if (!isAuthenticated) return null

  const touristLinks: NavItem[] = [
    { to: '/',              icon: Home,          label: 'Home'     },
    { to: '/explore',       icon: Compass,       label: 'Explore'  },
    { to: '/plans/create',  icon: Map,           label: 'Plan'     },
    { to: '/bookings',      icon: Calendar,      label: 'Bookings', badge: pendingBookingsCount },
    { to: '/notifications', icon: Bell,          label: 'Alerts',   badge: unreadCount },
    { to: '/profile',       icon: User,          label: 'Profile'  },
  ]

  // Guides deliberately have NO "My Stories" tab
  const guideLinks: NavItem[] = [
    { to: '/',               icon: Home,          label: 'Home'     },
    { to: '/explore',        icon: Compass,       label: 'Explore'  },
    { to: '/guide/bookings', icon: Calendar,      label: 'Bookings', badge: pendingBookingsCount },
    { to: '/guide/wallet',   icon: Wallet,        label: 'Wallet'   },
    { to: '/chat',           icon: MessageCircle, label: 'Chat',     badge: unreadChatCount },
    { to: '/profile',        icon: User,          label: 'Profile'  },
  ]

  const links = hasRole('Guide') ? guideLinks : touristLinks

  return (
    <nav className="safe-area-pb fixed inset-x-0 bottom-0 z-40 border-t border-sand-100 bg-[var(--bg-surface)]/95 backdrop-blur-xl dark:border-night-800 md:hidden">
      {/* Thin gold accent line at top of mobile nav */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

      <div className="flex h-16 items-center justify-around px-1">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex min-w-[52px] flex-col items-center gap-0.5 px-2 py-1 transition-colors',
                active
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              )}
            >
              <span className="relative">
                <Icon className={cn('h-5 w-5 transition-all', active && 'stroke-[2.5]')} />
                {badge !== undefined && badge > 0 && (
                  <span
                    className="absolute -right-2 -top-2 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[var(--bg-surface)]"
                    aria-label={`${badge} unread`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>

              <span className={cn('text-[10px] font-semibold', active ? 'text-primary-700 dark:text-primary-300' : 'text-slate-400')}>
                {label}
              </span>

              {/* Gold dot under active tab */}
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
