import { useEffect, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Star,
  UserCheck,
  Users,
  Wallet,
  TrendingUp,
  Globe,
  Calendar,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Card, CardSkeleton, Badge } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import { formatCurrency } from '@/utils/format'
import type { AdminStats, AgeDistribution } from '@/types'

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
  }, [showToast])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'Total Tourists', value: stats?.totalTourists ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Guides', value: stats?.totalGuides ?? 0, icon: UserCheck, color: 'bg-emerald-500' },
    { label: 'Pending Guides', value: stats?.pendingGuides ?? 0, icon: UserCheck, color: 'bg-amber-500' },
    { label: 'Completed Bookings', value: stats?.totalCompletedBookings ?? 0, icon: BookOpen, color: 'bg-violet-500' },
    { label: 'Total Revenue', value: formatCurrency(stats?.totalSystemRevenue ?? 0), icon: Wallet, color: 'bg-green-500' },
    { label: 'Outstanding Debts', value: formatCurrency(stats?.totalOutstandingDebts ?? 0), icon: TrendingUp, color: 'bg-red-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="h-7 w-7 text-primary-700" />
        Dashboard
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center text-white shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{label}</p>
                <p className="font-bold text-lg">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Performance */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            Monthly Performance
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              <div className="flex items-end gap-2 h-48 mb-2">
                {(stats?.monthlyPerformance ?? []).map((item) => {
                  const maxCount = Math.max(...(stats?.monthlyPerformance ?? []).map(x => x.bookingsCount), 1)
                  const height = (item.bookingsCount / maxCount) * 100
                  return (
                    <div key={item.monthName} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-primary-600 rounded-t-lg transition-all hover:bg-primary-700 cursor-pointer"
                          style={{ height: `${Math.max(8, height)}%`, minHeight: '4px' }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {item.bookingsCount} bookings • {formatCurrency(item.commission)}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 rotate-45 origin-left whitespace-nowrap">
                        {item.monthName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">Total Commission Revenue</span>
            <span className="font-bold text-primary-700">
              {formatCurrency(stats?.monthlyPerformance?.reduce((sum, m) => sum + m.commission, 0) ?? 0)}
            </span>
          </div>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-600" />
            Booking Status Distribution
          </h3>
          <div className="space-y-3">
            {(stats?.bookingStatusDistribution ?? []).map((item) => {
              const total = stats?.bookingStatusDistribution?.reduce((sum, s) => sum + s.count, 0) || 1
              const percentage = (item.count / total) * 100
              const getColor = () => {
                switch (item.statusName.toLowerCase()) {
                  case 'pending': return 'bg-amber-500'
                  case 'accepted': return 'bg-blue-500'
                  case 'completed': return 'bg-green-500'
                  case 'cancelled': return 'bg-red-500'
                  default: return 'bg-slate-500'
                }
              }
              return (
                <div key={item.statusName}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.statusName}</span>
                    <span className="font-semibold">{item.count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getColor()} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tourist Countries */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary-600" />
            Top Tourist Countries
          </h3>
          <div className="space-y-3">
            {(stats?.topTouristCountries ?? []).map((country, index) => (
              <div key={country.countryName} className="flex items-center gap-3">
                <div className="w-6 font-bold text-slate-400">#{index + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{country.countryName}</span>
                    <span className="text-slate-500">{country.count} visitors</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${(country.count / (stats?.topTouristCountries?.[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.topTouristCountries || stats.topTouristCountries.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">No data available</p>
            )}
          </div>
        </Card>

        {/* Top Rated Guides */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary-600" />
            Top Rated Guides
          </h3>
          <div className="space-y-3">
            {(stats?.topRatedGuides ?? []).map((guide, index) => (
              <div key={guide.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 font-bold text-slate-400">#{index + 1}</div>
                  <div>
                    <p className="font-medium">{guide.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-slate-500">{guide.rate.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="success">{formatCurrency(guide.earnings)}</Badge>
              </div>
            ))}
            {(!stats?.topRatedGuides || stats.topRatedGuides.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">No guides data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Third Row - Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Age Distribution */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-600" />
            Tourist Age Distribution
          </h3>
          <div className="space-y-3">
            {stats?.touristAgeDistribution && [
              { label: '18-25 (Youth)', key: 'youth', color: 'bg-blue-500' },
              { label: '26-40 (Adults)', key: 'adults', color: 'bg-cyan-500' },
              { label: '41-55 (Middle Aged)', key: 'middleAged', color: 'bg-emerald-500' },
              { label: '55+ (Seniors)', key: 'seniors', color: 'bg-amber-500' },
            ].map(({ label, key, color }) => {
              const value = stats.touristAgeDistribution?.[key as keyof AgeDistribution] ?? 0
              const total = Object.values(stats.touristAgeDistribution ?? {}).reduce((a, b) => a + b, 0) || 1
              const percentage = (value / total) * 100
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="font-semibold">{value} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top Requested Languages */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary-600" />
            Most Requested Languages
          </h3>
          <div className="space-y-3">
            {(stats?.topRequestedLanguages ?? []).map((lang) => (
              <div key={lang.language} className="flex items-center justify-between">
                <span className="font-medium">{lang.language}</span>
                <Badge variant="primary">{lang.count} requests</Badge>
              </div>
            ))}
            {(!stats?.topRequestedLanguages || stats.topRequestedLanguages.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">No language data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}