import { api } from './axios'
import type { Place, PlaceDetails } from '@/types'

export const placesApi = {
  // ── Public browsing ──────────────────────────────────────────────────────
  getAll: () =>
    api.get<Place[]>('/Places').then((r) => r.data),

  getById: (id: string, idFromModel = 0) =>
    api.get<PlaceDetails>(`/Places/${id}/${idFromModel}`).then((r) => r.data),

  getByAiId: (aiId: number) =>
    api.get<PlaceDetails>(`/Places/ai/${aiId}`).then((r) => r.data),

  getByType: (type: string) =>
    api.get<Place[]>(`/Places/filter?type=${encodeURIComponent(type)}`).then((r) => r.data),

  // ── Authenticated user actions ───────────────────────────────────────────
  addUserPhoto: (placeId: string, file: File) => {
    const fd = new FormData()
    fd.append('photoUrl', file)
    return api.post(`/Places/${placeId}/add-photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.message ?? 'Photo uploaded')
  },

  // ── Admin CRUD ───────────────────────────────────────────────────────────
  createPlace: (data: {
    name: string; type: string; city?: string; description?: string
    lat: number; lng: number; ticketPrice: number; affiliateLink?: string
    idFromModel?: number; isCustom?: boolean; mainImageFile?: File | null
  }) => {
    const fd = new FormData()
    fd.append('Name', data.name)
    fd.append('Type', data.type)
    fd.append('IsCustom', String(data.isCustom ?? true))
    if (data.city)         fd.append('City', data.city)
    if (data.description)  fd.append('Description', data.description)
    fd.append('Lat', String(data.lat))
    fd.append('Lng', String(data.lng))
    fd.append('TicketPrice', String(data.ticketPrice))
    if (data.affiliateLink) fd.append('AffiliateLink', data.affiliateLink)
    if (data.idFromModel)   fd.append('IdFromModel', String(data.idFromModel))
    if (data.mainImageFile) fd.append('MainImageUrl', data.mainImageFile)
    return api.post<Place>('/Places', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  updatePlace: (id: string, data: {
    name: string; type: string; city?: string; description?: string
    lat: number; lng: number; ticketPrice: number; affiliateLink?: string
    idFromModel?: number; mainImageFile?: File | null
  }) => {
    const fd = new FormData()
    fd.append('Name', data.name)
    fd.append('Type', data.type)
    if (data.city)         fd.append('City', data.city)
    if (data.description)  fd.append('Description', data.description)
    fd.append('Lat', String(data.lat))
    fd.append('Lng', String(data.lng))
    fd.append('TicketPrice', String(data.ticketPrice))
    if (data.affiliateLink) fd.append('AffiliateLink', data.affiliateLink)
    if (data.idFromModel)   fd.append('IdFromModel', String(data.idFromModel))
    if (data.mainImageFile) fd.append('MainImageUrl', data.mainImageFile)
    return api.put<Place>(`/Places/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  deletePlace: (id: string) =>
    api.delete(`/Places/${id}`).then((r) => r.message ?? 'Deleted'),

  deleteUserPhoto: (placeId: string, photoId: string) =>
    api.delete(`/Places/${placeId}/photos/${photoId}`).then((r) => r.message ?? 'Photo deleted'),
}
