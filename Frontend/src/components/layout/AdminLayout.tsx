import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Camera,
  LayoutDashboard,
  LogOut,
  MapPin,
  Star,
  Users,
  UserCheck,
  Bell,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/utils/cn'

const sidebarLinks = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/admin/users',        icon: Users,           label: 'Users'                     },
  { to: '/admin/pending-guides',icon: UserCheck,      label: 'Pending Guides'             },
  { to: '/admin/places',       icon: MapPin,          label: 'Places'                     },
  { to: '/admin/reviews',      icon: Star,            label: 'Reviews'                    },
  { to: '/admin/stories',      icon: Camera,          label: 'Stories'                    },
  { to: '/admin/notifications',icon: Bell,            label: 'Broadcast'                  },
]

export function AdminLayout() {
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-night-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 dark:bg-night-900 text-white shrink-0 border-r border-slate-800 dark:border-night-800">
        <div className="p-6 border-b border-slate-800 dark:border-night-800">
          <Link to="/admin" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-bold text-lg">Ather Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map(({ to, icon: Icon, label, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-700 text-white shadow-lg shadow-primary-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-night-800'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 dark:border-night-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-night-800 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            View Website
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (visible on every admin page) */}
        <header className="bg-slate-900 dark:bg-night-900 text-white px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-800 dark:border-night-800">
          <div className="lg:hidden flex items-center gap-2">
            <Logo />
            <span className="font-bold">Ather Admin</span>
          </div>

          <nav className="hidden lg:flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
            <span>Welcome,</span>
            <span className="text-white font-semibold">{user?.userName ?? 'Admin'}</span>
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle className="text-slate-300 hover:bg-slate-800 dark:hover:bg-night-800" />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile nav chips */}
        <nav className="lg:hidden bg-slate-900 dark:bg-night-900 px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {sidebarLinks.map(({ to, label, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                  active ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300 dark:bg-night-800'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-slate-50 dark:bg-night-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
