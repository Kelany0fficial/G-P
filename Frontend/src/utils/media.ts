/**
 * Resolve a server-relative media path to an absolute URL the browser can fetch.
 * - Returns undefined for empty input so <img> avatars can fall back to initials.
 * - Leaves absolute URLs (http/https/data:) unchanged.
 */
export function absoluteMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^(https?:|data:)/i.test(path)) return path
  const base =
    (import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') as string | undefined) ||
    'http://localhost:5008'
  const prefix = path.startsWith('/') ? '' : '/'
  return `${base}${prefix}${path}`
}
