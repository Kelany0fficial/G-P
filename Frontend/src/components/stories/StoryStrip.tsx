import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { storiesApi } from '@/api/stories'
import { Avatar, Button, ConfirmDialog, Input, Modal, Textarea } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/api/axios'
import { formatRelativeTime } from '@/utils/format'
import { absoluteMediaUrl } from '@/utils/media'
import { cn } from '@/utils/cn'
import type { Story } from '@/types'

const STORY_DURATION_MS = 6_000
const TAP_HOLD_THRESHOLD_MS = 220
const LEFT_TAP_RATIO = 0.3

const MAX_VIDEO_DURATION_S = 30

function isVideo(url: string) {
  return /\.(mp4|mov|webm|mkv)$/i.test(url)
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration) }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    video.src = url
  })
}

export function StoryStrip() {
  const [stories, setStories] = useState<Story[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerCity, setComposerCity] = useState('')
  const [composerDescription, setComposerDescription] = useState('')
  const [composerFile, setComposerFile] = useState<File | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [storyDurMs, setStoryDurMs] = useState<number | null>(STORY_DURATION_MS)
  const [localViewed, setLocalViewed] = useState<Set<string>>(new Set())
  const { showToast } = useToast()
  const { user } = useAuth()
  const viewedRef = useRef<Set<string>>(new Set())
  const tickerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pressTimerRef = useRef<number | null>(null)
  const heldDuringPressRef = useRef<boolean>(false)
  const pressXRef = useRef<number>(0)
  const pressWidthRef = useRef<number>(0)
  const progressRef = useRef(0)
  const activeBarRef = useRef<HTMLDivElement | null>(null)
  const viewerVideoRef = useRef<HTMLVideoElement | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await storiesApi.getActiveStories()
      setStories(data)
    } catch { /* silent on landing */ }
  }, [])

  useEffect(() => { load() }, [load])

  // Unviewed first, then viewed — each group sorted newest first
  const sorted = useMemo(() => {
    return [...stories].sort((a, b) => {
      const aViewed = localViewed.has(a.storyId) || (!!user?.id && a.userId === user.id && a.viewsCount > 0)
      const bViewed = localViewed.has(b.storyId) || (!!user?.id && b.userId === user.id && b.viewsCount > 0)
      if (aViewed !== bViewed) return aViewed ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [stories, localViewed, user?.id])

  const activeStory = activeIndex !== null ? sorted[activeIndex] : null

  // Reset duration when story changes; videos wait for onLoadedMetadata
  useEffect(() => {
    if (!activeStory) return
    if (!isVideo(activeStory.mediaUrl)) {
      setStoryDurMs(STORY_DURATION_MS)
    } else {
      setStoryDurMs(null)
    }
  }, [activeStory])

  const closeViewer = useCallback(() => {
    setActiveIndex(null)
    if (tickerRef.current !== null) {
      window.clearInterval(tickerRef.current)
      tickerRef.current = null
    }
  }, [])

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= sorted.length) { closeViewer(); return }
      setActiveIndex(next)
    },
    [closeViewer, sorted.length],
  )

  // Mark story as viewed locally + via API
  useEffect(() => {
    if (!activeStory) return
    if (viewedRef.current.has(activeStory.storyId)) return
    viewedRef.current.add(activeStory.storyId)
    setLocalViewed((prev) => new Set([...prev, activeStory.storyId]))
    storiesApi.viewStory(activeStory.storyId).catch(() => {})
  }, [activeStory])

  // Progress ticker — direct DOM update, no React re-renders
  useEffect(() => {
    if (activeIndex === null || isPaused || storyDurMs === null) return
    if (tickerRef.current !== null) window.clearInterval(tickerRef.current)
    progressRef.current = 0
    if (activeBarRef.current) activeBarRef.current.style.width = '0%'
    const step = 50
    const inc = (step / storyDurMs) * 100
    tickerRef.current = window.setInterval(() => {
      progressRef.current += inc
      if (progressRef.current >= 100) {
        progressRef.current = 0
        goTo(activeIndex + 1)
        return
      }
      if (activeBarRef.current) {
        activeBarRef.current.style.width = `${progressRef.current}%`
      }
    }, step)
    return () => { if (tickerRef.current !== null) window.clearInterval(tickerRef.current) }
  }, [activeIndex, isPaused, goTo, storyDurMs])

  // Keyboard navigation
  useEffect(() => {
    if (activeIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer()
      else if (e.key === 'ArrowRight') goTo(activeIndex + 1)
      else if (e.key === 'ArrowLeft') goTo(activeIndex - 1)
      else if (e.key === ' ') { e.preventDefault(); setIsPaused((p) => !p) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, closeViewer, goTo])

  // Sync video playback with pause state
  useEffect(() => {
    if (!viewerVideoRef.current) return
    if (isPaused) viewerVideoRef.current.pause()
    else viewerVideoRef.current.play().catch(() => {})
  }, [isPaused])

  const toggleLove = async (story: Story) => {
    setStories((prev) =>
      prev.map((s) =>
        s.storyId === story.storyId
          ? { ...s, isLovedByMe: !s.isLovedByMe, lovesCount: s.lovesCount + (s.isLovedByMe ? -1 : 1) }
          : s,
      ),
    )
    try {
      await storiesApi.toggleLove(story.storyId)
    } catch (err) {
      setStories((prev) =>
        prev.map((s) =>
          s.storyId === story.storyId
            ? { ...s, isLovedByMe: !s.isLovedByMe, lovesCount: s.lovesCount + (s.isLovedByMe ? 1 : -1) }
            : s,
        ),
      )
      showToast(getErrorMessage(err), 'error')
    }
  }

  const publishStory = async () => {
    if (!composerFile) { showToast('Pick a photo or video first.', 'error'); return }
    if (!composerCity.trim()) { showToast('City is required.', 'error'); return }
    if (!composerDescription.trim()) { showToast('Description is required.', 'error'); return }
    setIsPublishing(true)
    try {
      await storiesApi.createStory({
        city: composerCity.trim(),
        description: composerDescription.trim(),
        mediaFile: composerFile,
      })
      showToast('Story published!', 'success')
      setComposerOpen(false)
      setComposerFile(null)
      setComposerCity('')
      setComposerDescription('')
      await load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const deleteActiveStory = async () => {
    if (!activeStory) return
    setIsDeleting(true)
    try {
      await storiesApi.deleteOwn(activeStory.storyId)
      setStories((prev) => prev.filter((s) => s.storyId !== activeStory.storyId))
      const remaining = sorted.length - 1
      if (remaining === 0) closeViewer()
      else if (activeIndex !== null && activeIndex >= remaining) goTo(remaining - 1)
      showToast('Story deleted.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Instagram-style tap navigation
  const nextStory = useCallback(() => { if (activeIndex !== null) goTo(activeIndex + 1) }, [activeIndex, goTo])
  const prevStory = useCallback(() => { if (activeIndex !== null) goTo(activeIndex - 1) }, [activeIndex, goTo])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pressXRef.current = e.clientX - rect.left
    pressWidthRef.current = rect.width
    heldDuringPressRef.current = false
    if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current)
    pressTimerRef.current = window.setTimeout(() => {
      heldDuringPressRef.current = true
      setIsPaused(true)
    }, TAP_HOLD_THRESHOLD_MS)
  }

  const finishPress = () => {
    if (pressTimerRef.current !== null) { window.clearTimeout(pressTimerRef.current); pressTimerRef.current = null }
    if (heldDuringPressRef.current) { setIsPaused(false); heldDuringPressRef.current = false; return }
    const width = pressWidthRef.current || 1
    const xRatio = pressXRef.current / width
    if (xRatio < LEFT_TAP_RATIO) prevStory(); else nextStory()
  }

  const cancelPress = () => {
    if (pressTimerRef.current !== null) { window.clearTimeout(pressTimerRef.current); pressTimerRef.current = null }
    if (heldDuringPressRef.current) { setIsPaused(false); heldDuringPressRef.current = false }
  }

  return (
    <>
      {/* ── Stories strip ─────────────────────────────────────── */}
      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 py-3">
        {/* "+" Add story */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-20 shrink-0 flex-col items-center gap-1.5 outline-none"
        >
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-primary-400 bg-primary-50 text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-500/60 dark:bg-night-800 dark:text-primary-300">
            <Plus className="h-6 w-6" />
          </span>
          <span className="line-clamp-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">Your story</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            if (f.type.startsWith('video/')) {
              const dur = await getVideoDuration(f)
              if (dur > MAX_VIDEO_DURATION_S) {
                showToast(`Video must be ${MAX_VIDEO_DURATION_S} seconds or shorter.`, 'error')
                return
              }
            }
            setComposerFile(f)
            setComposerOpen(true)
          }}
        />

        {/* Story circles — sorted newest first */}
        {sorted.map((story, idx) => {
          const viewed = localViewed.has(story.storyId) || (!!user?.id && story.userId === user.id && story.viewsCount > 0)
          const mediaUrl = absoluteMediaUrl(story.mediaUrl)
          return (
            <button
              key={story.storyId}
              type="button"
              onClick={() => { setActiveIndex(idx); setIsPaused(false) }}
              className="flex w-20 shrink-0 flex-col items-center gap-1.5 outline-none"
            >
              {/* Ring dims when viewed; inner thumbnail stays vivid */}
              <span className={cn(viewed ? 'story-ring--viewed' : 'story-ring')}>
                <span className="block h-20 w-20 overflow-hidden rounded-full ring-2 ring-white dark:ring-gray-950">
                  {isVideo(story.mediaUrl) ? (
                    <video
                      src={mediaUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={story.userName}
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                    />
                  )}
                </span>
              </span>
              <span className="line-clamp-1 max-w-[4.5rem] text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {story.userId === user?.id ? 'You' : story.userName}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Full-screen viewer ────────────────────────────────── */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-2 py-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeViewer}
            className="absolute right-4 top-4 z-30 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="Close stories"
          >
            <X className="h-5 w-5" />
          </button>

          {activeIndex !== null && activeIndex > 0 && (
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 md:block"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {activeIndex !== null && activeIndex < sorted.length - 1 && (
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 md:block"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div className="relative h-full max-h-[90vh] w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 shadow-elevated animate-scale-in">
            {/* Progress bars */}
            <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
              {sorted.map((_, i) => (
                <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    ref={activeIndex === i ? activeBarRef : null}
                    className="h-full bg-white transition-[width] duration-[50ms] ease-linear"
                    style={{ width: i < (activeIndex ?? -1) ? '100%' : '0%' }}
                  />
                </div>
              ))}
            </div>

            {/* Header row */}
            <div className="absolute inset-x-3 top-7 z-20 flex items-center gap-2 text-white">
              <Avatar src={activeStory.userProfileImage} name={activeStory.userName} size="sm" />
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-semibold">{activeStory.userName}</p>
                <p className="text-xs opacity-80">
                  {activeStory.city} · {formatRelativeTime(activeStory.createdAt)}
                </p>
              </div>
              {activeStory.userId === user?.id && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                  className="rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-rose-500/70 disabled:opacity-50"
                  aria-label="Delete story"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-white/20"
                aria-label={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>

            {/* Media + tap zones */}
            <div className="relative h-full w-full select-none">
              {isVideo(activeStory.mediaUrl) ? (
                <video
                  ref={viewerVideoRef}
                  src={absoluteMediaUrl(activeStory.mediaUrl)}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration
                    setStoryDurMs(isFinite(dur) && dur > 0 ? Math.min(dur, MAX_VIDEO_DURATION_S) * 1000 : STORY_DURATION_MS)
                  }}
                />
              ) : (
                <img
                  src={absoluteMediaUrl(activeStory.mediaUrl)}
                  alt={activeStory.description}
                  className="h-full w-full object-cover"
                />
              )}

              <div
                className="absolute inset-0 z-10 flex"
                onPointerDown={handlePointerDown}
                onPointerUp={finishPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                role="presentation"
              >
                <div style={{ width: `${LEFT_TAP_RATIO * 100}%` }} className="h-full cursor-pointer" aria-label="Previous story" />
                <div style={{ width: `${(1 - LEFT_TAP_RATIO) * 100}%` }} className="h-full cursor-pointer" aria-label="Next story" />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 text-white">
                <p className="text-sm leading-relaxed">{activeStory.description}</p>
                <div className="pointer-events-auto mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleLove(activeStory)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                      activeStory.isLovedByMe
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/10 text-white backdrop-blur hover:bg-white/20',
                    )}
                  >
                    <Heart className={cn('h-4 w-4', activeStory.isLovedByMe && 'fill-current')} />
                    {activeStory.lovesCount}
                  </button>
                  <span className="text-xs opacity-80">{activeStory.viewsCount} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Story composer modal ───────────────────────────────── */}
      <Modal
        isOpen={composerOpen}
        onClose={() => {
          setComposerOpen(false)
          setComposerFile(null)
          setComposerCity('')
          setComposerDescription('')
        }}
        title="Share a story"
        description="Stories disappear after 24 hours."
      >
        <div className="space-y-4">
          {composerFile && (
            <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-night-800">
              {composerFile.type.startsWith('video/') ? (
                <video src={URL.createObjectURL(composerFile)} controls className="max-h-64 w-full object-cover" />
              ) : (
                <img src={URL.createObjectURL(composerFile)} alt="Story preview" className="max-h-64 w-full object-cover" />
              )}
            </div>
          )}
          <Input
            label="City"
            value={composerCity}
            onChange={(e) => setComposerCity(e.target.value)}
            placeholder="e.g., Luxor, Cairo, Aswan"
            required
          />
          <Textarea
            label="Description"
            value={composerDescription}
            onChange={(e) => setComposerDescription(e.target.value)}
            placeholder="What's happening?"
            rows={3}
            maxLength={300}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setComposerOpen(false)}>Cancel</Button>
            <Button onClick={publishStory} isLoading={isPublishing}>Publish</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Story"
        message="This story will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        danger
        onConfirm={() => { setConfirmDelete(false); deleteActiveStory() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
