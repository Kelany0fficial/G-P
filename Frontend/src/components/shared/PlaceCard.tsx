import { Link } from 'react-router-dom'
import { MapPin, Star, Ticket, Eye } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { absoluteMediaUrl } from '@/utils/media'
import { formatCurrency } from '@/utils/format'
import type { Place } from '@/types'

interface PlaceCardProps {
  place: Place & { averageRate?: number | null; rating?: number | null }
}

function pickRating(p: PlaceCardProps['place']): number | null {
  const raw = p.averageRate ?? p.rating
  if (raw === null || raw === undefined) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function PlaceCard({ place }: PlaceCardProps) {
  const rating = pickRating(place)
  const image = absoluteMediaUrl(place.mainImageUrl) || 'https://placehold.co/600x400?text=Explore+Egypt'

  if (!place.id) {
    return null
  }

  return (
    <Link to={`/explore/${place.id}`} aria-label={`View details for ${place.name}`} className="block group">
      <Card
        hover
        padding="none"
        // صغرنا الحواف شوية على الموبايل وكبرناها على الديسكتوب
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:border-amber-200 group-hover:shadow-2xl group-hover:shadow-amber-500/10 dark:border-slate-800 dark:bg-slate-950 dark:group-hover:border-amber-500/30"
      >
        {/* قسم الصورة */}
        {/* التعديل هنا: aspect-square للموبايل (مربعة وتأخذ مساحة ممتازة) و aspect-[16/10] للكمبيوتر */}
        <div className="relative aspect-square sm:aspect-[16/10] overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
          <img
            src={image}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Available'
            }}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* شارة السعر - صغرنا حجمها على الموبايل */}
          <div
            className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-black shadow-lg backdrop-blur-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)',
              color: '#FCD34D',
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}
          >
            <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-bold tracking-tight">
              {place.ticketPrice > 0 ? formatCurrency(place.ticketPrice) : 'Free'}
            </span>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-black/30 backdrop-blur-[2px]">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/20 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white border border-white/30 shadow-xl transition-all duration-300 group-hover:translate-y-0 translate-y-3">
               <Eye className="w-3 h-3 sm:w-4 sm:h-4"/>
               Explore
            </div>
          </div>
        </div>

        {/* قسم تفاصيل المكان - صغرنا المسافات (Padding) للموبايل p-3 وللكمبيوتر p-5 */}
        <div className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            {/* صغرنا الخط على الموبايل */}
            <h3 className="line-clamp-1 text-sm font-black sm:text-lg text-slate-900 dark:text-white transition-colors duration-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">
              {place.name}
            </h3>
            <Badge
              variant="default"
              // صغرنا الـ Badge جداً على الموبايل أو ممكن نخفيها لو حبينا، بس خليناها صغيرة ألطف
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:border-night-700 dark:bg-night-800 dark:text-slate-300"
            >
              {place.type || 'Attraction'}
            </Badge>
          </div>
          
          {/* قسم المدينة والتقييم - صغرنا المسافة العلوية للموبايل */}
          <div className="mt-2 sm:mt-4 flex flex-col xl:flex-row xl:items-center justify-between gap-2 sm:gap-0">
            {/* المدينة */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-500" />
              <span className="line-clamp-1">{place.city || 'Egypt'}</span>
            </div>

            {/* التقييم بـ 5 نجوم */}
            <div>
              {rating !== null ? (
                <div className="flex items-center gap-1.5 sm:gap-2" title={`${rating} out of 5`}>
                  <div className="relative inline-flex items-center">
                    {/* النجوم الفارغة */}
                    <div className="flex gap-[1px] sm:gap-0.5 text-slate-200 dark:text-slate-700">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                      ))}
                    </div>
                    {/* النجوم الممتلئة */}
                    <div
                      className="absolute left-0 top-0 flex gap-[1px] sm:gap-0.5 overflow-hidden text-amber-500"
                      style={{ width: `${(rating / 5) * 100}%` }}
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0 fill-current" />
                      ))}
                    </div>
                  </div>
                  {/* رقم التقييم */}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                    {rating.toFixed(1)}
                  </span>
                </div>
              ) : (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  New
                </span>
              )}
            </div>
          </div>

        </div>
      </Card>
    </Link>
  )
}