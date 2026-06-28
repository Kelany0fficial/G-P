import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Camera,
  Clock,
  ExternalLink,
  Grid,
  ImagePlus,
  Map as MapIcon,
  MapPin,
  Star,
  Ticket,
  X,
} from 'lucide-react'
import { placesApi } from '@/api/places'
import { reviewsApi } from '@/api/reviews'
import { useAuth } from '@/context/AuthContext'
import { Badge, Button, CardSkeleton, StarRating, useToast } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import type { PlaceDetails } from '@/types'
import { formatCurrency } from '@/utils/format'
import { absoluteMediaUrl } from '@/utils/media'

export function PlaceDetailPage() {
  // Two routes mount this page:
  //   /explore/:id        → DB Guid   (Manual Plan & global browse)
  //   /explore/ai/:aiId   → IdFromModel (AI Plan)
  const { id, aiId }  = useParams<{ id?: string; aiId?: string }>()
  const isAiLookup    = Boolean(aiId)
  const lookupKey     = isAiLookup ? `ai:${aiId}` : `db:${id}`

  const [place, setPlace]                   = useState<PlaceDetails | null>(null)
  const [isLoading, setIsLoading]           = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating]     = useState(5)
  const [reviewComment, setReviewComment]   = useState('')
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [isUploadingPhoto, setIsUploading]  = useState(false)
  const [allPhotosOpen, setAllPhotosOpen]   = useState(false)
  const [lightboxUrl, setLightboxUrl]       = useState<string | null>(null)
  const photoInputRef                        = useRef<HTMLInputElement>(null)
  const { isAuthenticated, hasRole }         = useAuth()
  const { showToast }                        = useToast()

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchPlace = async (): Promise<PlaceDetails | null> => {
    if (isAiLookup) {
      const n = Number(aiId)
      if (!Number.isFinite(n) || n <= 0) return null
      return placesApi.getByAiId(n)
    }
    if (!id) return null
    return placesApi.getById(id, 0)
  }

  const refresh = async () => {
    try {
      const updated = await fetchPlace()
      if (updated) setPlace(updated)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchPlace()
      .then((data)  => { if (!cancelled) setPlace(data) })
      .catch((err)  => { if (!cancelled) showToast(getErrorMessage(err), 'error') })
      .finally(()   => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey])

  // ── Review ─────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) { showToast('Please enter a review comment.', 'error'); return }
    if (!place?.id)             { showToast('Cannot review an unsynced place.',  'error'); return }
    setIsSubmitting(true)
    try {
      await reviewsApi.addPlaceReview({ placeId: place.id, rate: reviewRating, comment: reviewComment.trim() })
      showToast('Review added!', 'success')
      setReviewComment(''); setReviewRating(5); setShowReviewForm(false)
      await refresh()
    } catch (err) { showToast(getErrorMessage(err), 'error') }
    finally       { setIsSubmitting(false) }
  }

  // ── Photo upload ────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file || !place?.id) return
    if (!file.type.startsWith('image/'))          { showToast('Image files only.',           'error'); return }
    if (file.size > 5 * 1024 * 1024)              { showToast('Max file size is 5 MB.',      'error'); return }
    setIsUploading(true)
    try {
      await placesApi.addUserPhoto(place.id, file)
      showToast('Photo added — thanks for sharing!', 'success')
      await refresh()
    } catch (err) { showToast(getErrorMessage(err), 'error') }
    finally       { setIsUploading(false) }
  }

  // ── Render guards ───────────────────────────────────────────────────────
  if (isLoading) return <div className="container-app py-10"><CardSkeleton /></div>
  if (!place) return (
    <div className="container-app py-20 text-center">
      <p className="text-xl font-bold text-[var(--text-primary)]">Place not found.</p>
      <p className="mt-2 text-sm text-muted">This destination may not exist or the link is broken.</p>
    </div>
  )

  const hero          = absoluteMediaUrl(place.mainImageUrl) || 'https://placehold.co/1200x400?text=No+Image'
  const hasRating     = typeof place.averageRate === 'number' && place.averageRate > 0
  const hasCoords     = Number.isFinite(place.lat) && Number.isFinite(place.lng) && (place.lat !== 0 || place.lng !== 0)
// استخدام Google Maps بدلاً من OpenStreetMap لتفادي مشاكل الـ WebGL
  const mapSrc = hasCoords
    ? `https://maps.google.com/maps?q=${place.lat},${place.lng}&z=15&output=embed`
    : ''
  const mapHref = hasCoords
    ? `https://maps.google.com/maps?q=${place.lat},${place.lng}`
    : ''

  return (
    <div className="bg-[var(--bg-canvas)]">

      {/* ── Hero image ── */}
      <div className="relative overflow-hidden" style={{ maxHeight: 400 }}>
        <img
          src={hero}
          alt={place.name}
          className="h-full w-full object-cover"
          style={{ maxHeight: 400, display: 'block', width: '100%' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      </div>

      <div className="container-app py-8">

        {/* ── Title row ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {place.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  {place.city || 'Egypt'}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-gold-500 dark:text-gold-400">
                  <Star className="h-4 w-4 fill-current" />
                  {hasRating ? place.averageRate.toFixed(1) : 'New'}
                  <span className="font-normal text-muted">
                    ({place.reviews?.length ?? 0} reviews)
                  </span>
                </span>
              </div>
            </div>
            <Badge variant="primary" className="px-3 py-1 text-sm">{place.type}</Badge>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-gold-400/40 via-sand-200 to-transparent dark:from-gold-400/20 dark:via-night-700 dark:to-transparent" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN GRID:
              left  (lg: 2/3) — About, Traveler Photos, Reviews
              right (lg: 1/3) — Info cards, Map, Add Photo
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,360px)]">

          {/* ── LEFT: Main content ── */}
          <div className="space-y-10">

            {/* About */}
            <section>
              <SectionHeading>About This Place</SectionHeading>
              <p className="whitespace-pre-line leading-relaxed text-muted">
                {place.description || 'No description available.'}
              </p>
            </section>

            {/* Traveler Photos — 3 preview cards + "View All" 4th card */}
            {place.userPhotos && place.userPhotos.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <SectionHeading>Traveler Photos ({place.userPhotos.length})</SectionHeading>
                  {isAuthenticated && (
                    <Button size="sm" variant="outline" onClick={() => photoInputRef.current?.click()} isLoading={isUploadingPhoto}>
                      <Camera className="h-4 w-4" /> Add yours
                    </Button>
                  )}
                </div>

                {/* Grid: always 4 columns — first 3 are real photos, 4th is "View All" */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {place.userPhotos.slice(0, 3).map((photo, idx) => (
                    <button
                      key={photo.id || idx}
                      type="button"
                      onClick={() => setLightboxUrl(absoluteMediaUrl(photo.photoUrl) ?? null)}
                      className="group relative overflow-hidden rounded-xl ring-1 ring-sand-100 dark:ring-night-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <img
                        src={absoluteMediaUrl(photo.photoUrl)}
                        alt={`Photo by ${photo.userName}`}
                        loading="lazy"
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <p className="absolute inset-x-2 bottom-1.5 truncate text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {photo.userName}
                      </p>
                    </button>
                  ))}

                  {/* 4th card — always visible if there are any photos; shows "View All" */}
                  <button
                    type="button"
                    onClick={() => setAllPhotosOpen(true)}
                    className="group relative overflow-hidden rounded-xl ring-1 ring-sand-200 dark:ring-night-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {/* Blurred background from 4th photo (or 3rd if only 3) */}
                    {place.userPhotos[3] || place.userPhotos[2] ? (
                      <img
                        src={absoluteMediaUrl((place.userPhotos[3] ?? place.userPhotos[2]).photoUrl)}
                        alt=""
                        aria-hidden
                        className="h-32 w-full object-cover blur-[2px] scale-110 brightness-50"
                      />
                    ) : (
                      <div className="h-32 w-full bg-slate-200 dark:bg-night-700" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                      <Grid className="h-6 w-6 text-white" />
                      <span className="text-sm font-bold text-white">
                        {place.userPhotos.length > 3
                          ? `+${place.userPhotos.length - 3} more`
                          : 'View All'}
                      </span>
                    </div>
                  </button>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <div className="mb-4 flex items-center justify-between gap-2">
                <SectionHeading>Reviews ({place.reviews?.length ?? 0})</SectionHeading>
                {isAuthenticated && hasRole('Tourist') && !showReviewForm && (
                  <Button variant="outline" onClick={() => setShowReviewForm(true)}>
                    Write a Review
                  </Button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-6 rounded-2xl bg-sand-50 p-5 ring-1 ring-sand-100 dark:bg-night-800 dark:ring-night-700">
                  <h3 className="mb-3 font-bold text-[var(--text-primary)]">Rate your experience</h3>
                  <StarRating value={reviewRating} onChange={setReviewRating} size="md" />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share details of your experience…"
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-sand-200 bg-white p-3 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-night-600 dark:bg-night-900"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                    <Button onClick={handleSubmitReview} isLoading={isSubmitting}>Submit Review</Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {place.reviews && place.reviews.length > 0 ? (
                  place.reviews.map((review, idx) => (
                    <div key={idx} className="rounded-2xl bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)]">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{review.touristName}</span>
                        <StarRating rating={review.rate} />
                      </div>
                      <p className="text-sm text-muted">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-sand-50/60 p-6 text-center text-sm text-muted dark:bg-night-800/60">
                    No reviews yet. Be the first to review this place!
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="space-y-4">

            {/* Entry fee */}
            <InfoCard icon={<Ticket className="h-5 w-5" />} label="Entry Fee" color="gold">
              {place.ticketPrice === 0 ? 'Free Entry' : formatCurrency(place.ticketPrice)}
            </InfoCard>

            {/* Opening hours */}
            {place.openingHours && (
              <InfoCard icon={<Clock className="h-5 w-5" />} label="Opening Hours" color="primary">
                {place.openingHours}
              </InfoCard>
            )}

            {/* Affiliate link */}
            {place.affiliateLink && (
              <a
                href={place.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)] transition-all hover:ring-primary-300 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-night-700 dark:text-primary-300">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Book Tickets</p>
                  <p className="mt-0.5 text-sm font-bold text-primary-700 dark:text-primary-300">Book Now →</p>
                </div>
              </a>
            )}

            {/* Add photo CTA */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="group flex w-full items-center gap-4 rounded-2xl bg-[var(--bg-surface)] p-4 text-left shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)] transition-all hover:ring-gold-400/60 hover:shadow-[var(--shadow-md)] disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600 transition-colors group-hover:bg-gold-500 group-hover:text-white dark:bg-night-700 dark:text-gold-400">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Share a Memory</p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">
                    {isUploadingPhoto ? 'Uploading…' : 'Add Your Photo'}
                  </p>
                </div>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

            {/* Map — compact inside sidebar, NOT full-page-width */}
            {hasCoords && (
              <div className="overflow-hidden rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <h3 className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    <MapIcon className="h-4 w-4 text-primary-600" />
                    Location
                  </h3>
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-300"
                  >
                    Open Full Map ↗
                  </a>
                </div>

                {/* Map iframe: h-[260px], contained in the 360px sidebar */}
                <iframe
                  title={`Map of ${place.name}`}
                  src={mapSrc}
                  className="block h-[260px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <p className="px-4 py-2 text-[10px] font-medium text-muted">
                  {place.lat.toFixed(4)}°N · {place.lng.toFixed(4)}°E
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── All Photos Modal ──────────────────────────────────────────────── */}
      {allPhotosOpen && place.userPhotos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setAllPhotosOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-3xl bg-[var(--bg-surface)]/95 px-6 py-4 backdrop-blur-md border-b border-[var(--border-subtle)]">
              <h2 className="flex items-center gap-2 text-lg font-black text-[var(--text-primary)]">
                <span className="h-5 w-1 rounded-full bg-gold-400" aria-hidden />
                All Photos · {place.userPhotos.length}
              </h2>
              <button
                type="button"
                onClick={() => setAllPhotosOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-night-700 dark:text-slate-300 dark:hover:bg-night-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {place.userPhotos.map((photo, idx) => (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => {
                    setLightboxUrl(absoluteMediaUrl(photo.photoUrl) ?? null)
                    setAllPhotosOpen(false)
                  }}
                  className="group relative overflow-hidden rounded-xl ring-1 ring-sand-100 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:ring-night-700"
                >
                  <img
                    src={absoluteMediaUrl(photo.photoUrl)}
                    alt={`Photo by ${photo.userName}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-[10px] font-semibold text-white">{photo.userName}</p>
                    <p className="text-[9px] text-white/70">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Upload CTA in modal */}
            {isAuthenticated && (
              <div className="border-t border-[var(--border-subtle)] p-4">
                <Button
                  variant="outline" fullWidth
                  onClick={() => { setAllPhotosOpen(false); photoInputRef.current?.click() }}
                  isLoading={isUploadingPhoto}
                >
                  <Camera className="h-4 w-4" /> Add Your Photo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white backdrop-blur hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

/* ─── Small local helpers ─────────────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-[var(--text-primary)]">
      <span className="h-5 w-1 rounded-full bg-gold-400" aria-hidden />
      {children}
    </h2>
  )
}

function InfoCard({
  icon,
  label,
  color,
  children,
}: {
  icon: React.ReactNode
  label: string
  color: 'gold' | 'primary'
  children: React.ReactNode
}) {
  const bg =
    color === 'gold'
      ? 'bg-gold-100 text-gold-600 dark:bg-night-700 dark:text-gold-400'
      : 'bg-primary-100 text-primary-700 dark:bg-night-700 dark:text-primary-300'

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
        <p className="mt-0.5 font-bold text-[var(--text-primary)]">{children}</p>
      </div>
    </div>
  )
}
