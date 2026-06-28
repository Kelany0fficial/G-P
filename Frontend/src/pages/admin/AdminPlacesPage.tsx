import { useEffect, useRef, useState } from 'react'
import {
  Images,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Ticket,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { placesApi } from '@/api/places'
import { Button, Input, ListSkeleton, useToast } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { absoluteMediaUrl } from '@/utils/media'
import { formatCurrency } from '@/utils/format'
import type { Place, PlaceDetails } from '@/types'
import { cn } from '@/utils/cn'

// ── Place type options ────────────────────────────────────────────────────────
const PLACE_TYPES = [
  'Historical', 'Beach', 'Museum', 'Religious', 'Modern',
  'Desert', 'Nile', 'Entertainment', 'Nature', 'Other',
]

interface PlaceForm {
  name: string; type: string; city: string; description: string
  lat: string; lng: string; ticketPrice: string
  affiliateLink: string; idFromModel: string; isCustom: boolean
}
const emptyForm = (): PlaceForm => ({
  name: '', type: PLACE_TYPES[0], city: '', description: '',
  lat: '0', lng: '0', ticketPrice: '0',
  affiliateLink: '', idFromModel: '0', isCustom: true,
})
const fromPlace = (p: Place): PlaceForm => ({
  name: p.name, type: p.type, city: p.city ?? '',
  description: '', lat: String(p.lat ?? 0), lng: String(p.lng ?? 0),
  ticketPrice: String(p.ticketPrice ?? 0), affiliateLink: '',
  idFromModel: String(p.idFromModel ?? 0), isCustom: true,
})

export function AdminPlacesPage() {
  const { showToast } = useToast()

  const [places, setPlaces]         = useState<Place[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  // Form modal (add / edit)
  const [formOpen, setFormOpen]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState<PlaceForm>(emptyForm())
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const imageInputRef                = useRef<HTMLInputElement>(null)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Place | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Photos modal
  const [photosPlace, setPhotosPlace]         = useState<PlaceDetails | null>(null)
  const [photosLoading, setPhotosLoading]     = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto]   = useState(false)
  const [lightboxUrl, setLightboxUrl]         = useState<string | null>(null)
  const photoUploadRef                         = useRef<HTMLInputElement>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadPlaces = async () => {
    setLoading(true)
    try { setPlaces(await placesApi.getAll()) }
    catch (e) { showToast(getErrorMessage(e), 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadPlaces() }, [])

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = places.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || p.type === typeFilter
    return matchSearch && matchType
  })

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null); setForm(emptyForm())
    setImageFile(null); setImagePreview(null); setFormOpen(true)
  }
  const openEdit = (p: Place) => {
    setEditingId(p.id); setForm(fromPlace(p))
    setImageFile(null); setImagePreview(absoluteMediaUrl(p.mainImageUrl) ?? null); setFormOpen(true)
  }
  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }
  const handleSave = async () => {
    if (!form.name.trim() || !form.type.trim()) {
      showToast('Name and type are required.', 'error'); return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(), type: form.type,
        city: form.city.trim(), description: form.description.trim(),
        lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0,
        ticketPrice: parseFloat(form.ticketPrice) || 0,
        affiliateLink: form.affiliateLink.trim(),
        idFromModel: parseInt(form.idFromModel, 10) || 0,
        isCustom: form.isCustom,
        mainImageFile: imageFile,
      }
      if (editingId) {
        await placesApi.updatePlace(editingId, payload)
        showToast('Place updated.', 'success')
      } else {
        await placesApi.createPlace(payload)
        showToast('Place added.', 'success')
      }
      setFormOpen(false)
      await loadPlaces()
    } catch (e) { showToast(getErrorMessage(e), 'error') }
    finally { setSaving(false) }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await placesApi.deletePlace(deleteTarget.id)
      showToast('Place deleted.', 'success')
      setDeleteTarget(null)
      await loadPlaces()
    } catch (e) { showToast(getErrorMessage(e), 'error') }
    finally { setDeleting(false) }
  }

  // ── Photos modal ──────────────────────────────────────────────────────────
  const openPhotos = async (p: Place) => {
    setPhotosPlace(null); setPhotosLoading(true)
    try {
      const details = await placesApi.getById(p.id, 0)
      setPhotosPlace(details)
    } catch (e) { showToast(getErrorMessage(e), 'error') }
    finally { setPhotosLoading(false) }
  }
  const handleDeletePhoto = async (photoId: string) => {
    if (!photosPlace) return
    setDeletingPhotoId(photoId)
    try {
      await placesApi.deleteUserPhoto(photosPlace.id, photoId)
      showToast('Photo deleted.', 'success')
      setPhotosPlace((prev) => prev
        ? { ...prev, userPhotos: prev.userPhotos.filter((ph) => ph.id !== photoId) }
        : prev
      )
    } catch (e) { showToast(getErrorMessage(e), 'error') }
    finally { setDeletingPhotoId(null) }
  }
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f || !photosPlace) return
    setUploadingPhoto(true)
    try {
      await placesApi.addUserPhoto(photosPlace.id, f)
      showToast('Photo added.', 'success')
      const updated = await placesApi.getById(photosPlace.id, 0)
      setPhotosPlace(updated)
    } catch (e) { showToast(getErrorMessage(e), 'error') }
    finally { setUploadingPhoto(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Places</h1>
          <p className="mt-1 text-sm text-muted">{places.length} destinations in database</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add New Place
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or city…"
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          <option value="All">All Types</option>
          {PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Places grid */}
      {loading ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-surface)] p-12 text-center text-muted shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)]">
          No places found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((place) => (
            <div
              key={place.id}
              className="group relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)] transition-all hover:shadow-[var(--shadow-md)]"
            >
              {/* Thumbnail */}
              <div className="relative h-40 overflow-hidden bg-slate-200 dark:bg-night-700">
                <img
                  src={absoluteMediaUrl(place.mainImageUrl) || 'https://placehold.co/600x300?text=No+Image'}
                  alt={place.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x300?text=No+Image' }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {place.type}
                  </span>
                  {place.idFromModel > 0 && (
                    <span className="rounded-full bg-gold-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-900 backdrop-blur-sm">
                      AI #{place.idFromModel}
                    </span>
                  )}
                </div>
                {(place.averageRate ?? 0) > 0 && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-gold-300 backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-current" />
                    {(place.averageRate ?? 0).toFixed(1)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-black text-[var(--text-primary)] line-clamp-1">{place.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  {place.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {place.city}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    {place.ticketPrice > 0 ? formatCurrency(place.ticketPrice) : 'Free'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(place)} className="flex-1 gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => openPhotos(place)} className="flex-1 gap-1.5">
                  <Images className="h-3.5 w-3.5" /> Photos
                </Button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(place)}
                  className="flex items-center justify-center rounded-xl p-2 text-muted transition-colors hover:bg-red-50 hover:text-rose-600 dark:hover:bg-red-500/10"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Place Modal ────────────────────────────────────────── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-surface)] shadow-2xl ring-1 ring-[var(--border-default)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-3xl bg-[var(--bg-surface)]/95 px-6 py-4 backdrop-blur-md border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                {editingId ? 'Edit Place' : 'Add New Place'}
              </h2>
              <button type="button" onClick={() => setFormOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-slate-100 dark:hover:bg-night-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Image preview */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                  Main Image
                </label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={cn(
                    'relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
                    imagePreview ? 'border-transparent' : 'border-sand-300 hover:border-primary-400 dark:border-night-600'
                  )}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">Click to upload image</p>
                    </div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />
              </div>

              {/* Name */}
              <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Karnak Temple" />

              {/* Type */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  {PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* City */}
              <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g., Luxor" />

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Describe this place…"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Lat / Lng */}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Latitude" type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="27.1750" />
                <Input label="Longitude" type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="31.1735" />
              </div>

              {/* Ticket / AI ID */}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ticket Price (EGP)" type="number" min={0} value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} />
                <div>
                  <Input label="AI Model ID" type="number" min={0} value={form.idFromModel} onChange={(e) => setForm({ ...form, idFromModel: e.target.value })} />
                  <p className="mt-1 text-[10px] text-muted">Must match what the Python AI returns</p>
                </div>
              </div>

              {/* Affiliate link */}
              <Input label="Affiliate / Booking Link" value={form.affiliateLink} onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })} placeholder="https://…" />

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} isLoading={saving}>
                  {editingId ? 'Save Changes' : 'Add Place'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-surface)] p-6 shadow-2xl ring-1 ring-[var(--border-default)] animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">Delete Place</h2>
            <p className="mt-2 text-sm text-muted">
              Permanently delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                fullWidth className="bg-rose-600 text-white hover:bg-rose-500"
                isLoading={deleting} onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photos Management Modal ───────────────────────────────────────── */}
      {(photosPlace || photosLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-surface)] shadow-2xl ring-1 ring-[var(--border-default)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-3xl bg-[var(--bg-surface)]/95 px-6 py-4 backdrop-blur-md border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Manage Photos
                {photosPlace && <span className="ml-2 text-sm font-normal text-muted">— {photosPlace.name}</span>}
              </h2>
              <div className="flex items-center gap-2">
                {photosPlace && (
                  <Button
                    size="sm" variant="outline"
                    onClick={() => photoUploadRef.current?.click()}
                    isLoading={uploadingPhoto}
                  >
                    <Upload className="h-3.5 w-3.5" /> Add Photo
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => { setPhotosPlace(null) }}
                  className="rounded-full p-2 text-muted hover:bg-slate-100 dark:hover:bg-night-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <input ref={photoUploadRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />

            <div className="p-6">
              {photosLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl skeleton" />
                  ))}
                </div>
              ) : !photosPlace?.userPhotos?.length ? (
                <div className="py-12 text-center text-muted">
                  <Images className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p className="font-medium">No photos yet.</p>
                  <p className="mt-1 text-sm">Click "Add Photo" to upload the first one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photosPlace.userPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-xl ring-1 ring-[var(--border-subtle)]"
                    >
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(absoluteMediaUrl(photo.photoUrl) ?? null)}
                        className="block w-full"
                      >
                        <img
                          src={absoluteMediaUrl(photo.photoUrl)}
                          alt={`By ${photo.userName}`}
                          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-[10px] font-semibold text-white">{photo.userName}</p>
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={deletingPhotoId === photo.id}
                        className="absolute right-1.5 top-1.5 rounded-full bg-rose-600 p-1.5 text-white shadow opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                        aria-label="Delete photo"
                      >
                        {deletingPhotoId === photo.id
                          ? <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          : <Trash2 className="h-3 w-3" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button" aria-label="Close"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white backdrop-blur hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl} alt="Full size"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
