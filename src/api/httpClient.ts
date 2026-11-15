import { useAppStore } from '@/store/app.store'
import type { CoverArt } from '@/types/coverArtType'
export type QueryType = Record<string, string | number | undefined>
export interface FetchOptions extends RequestInit {
  query?: QueryType
}
export function normalizeServerUrl(value: string) {
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      'Enter an HTTP(S) Supernova server URL without credentials, a query, or fragment.',
    )
  return url.toString().replace(/\/+$/, '')
}
export async function requestAt<T>(
  base: string,
  path: string,
  options: FetchOptions = {},
  token?: string,
): Promise<T> {
  if (!path.startsWith('/api/'))
    throw new Error('Only native Supernova API routes are supported')
  const url = new URL(normalizeServerUrl(base) + path)
  for (const [key, value] of Object.entries(options.query || {}))
    if (value !== undefined) url.searchParams.set(key, String(value))
  const { query: _, ...init } = options
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json')
  const deadline = AbortSignal.timeout(30000)
  let response: Response
  if (window.api?.supernovaRequest) {
    init.signal?.throwIfAborted()
    const reply = await window.api.supernovaRequest({
      url: url.toString(),
      method: init.method || 'GET',
      token,
      body: typeof init.body === 'string' ? init.body : undefined,
    })
    init.signal?.throwIfAborted()
    response = new Response(reply.body || null, { status: reply.status })
  } else
    response = await fetch(url, {
      ...init,
      headers,
      signal: init.signal ? AbortSignal.any([init.signal, deadline]) : deadline,
      redirect: 'error',
      credentials: 'omit',
    })
  if (!response.ok)
    throw new Error(
      (await response.text()).slice(0, 400) ||
        `Supernova request failed (${response.status})`,
    )
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}
export function request<T>(path: string, options: FetchOptions = {}) {
  const { url, token } = useAppStore.getState().data
  return requestAt<T>(url, path, options, token)
}
export async function pages<T>(
  path: string,
  query: QueryType = {},
  count = Number.POSITIVE_INFINITY,
  offset = 0,
): Promise<T[]> {
  const result: T[] = []
  while (result.length < count) {
    const limit = Math.min(1000, count - result.length)
    const batch =
      (await request<T[] | null>(path, {
        query: { ...query, limit, offset: offset + result.length },
      })) || []
    result.push(...batch)
    if (batch.length < limit) break
  }
  return result
}
export function getSimpleCoverArtUrl(
  id?: string,
  type: CoverArt = 'album',
  _size = '300',
): string {
  if (!id || type === 'artist')
    return `/default_${type === 'artist' ? 'artist' : 'album'}_art.png`
  return `${useAppStore.getState().data.url}/api/art/album/${encodeURIComponent(id)}`
}
export async function getCoverArtUrl(
  id?: string,
  type: CoverArt = 'album',
  size = '300',
): Promise<string> {
  if (id && type === 'artist') {
    const artist = await request<{ image_url?: string }>(
      `/api/artists/${encodeURIComponent(id)}`,
    )
    if (artist.image_url && /^https?:\/\//.test(artist.image_url))
      return artist.image_url
  }
  return getSimpleCoverArtUrl(id, type, size)
}
async function mediaUrl(
  id: string,
  scope: 'stream' | 'download-track' | 'download-album',
  format?: string,
) {
  const { ticket } = await request<{ ticket: string }>('/api/media-ticket', {
    method: 'POST',
    body: JSON.stringify({ scope, resource: id }),
  })
  const route =
    scope === 'stream'
      ? 'stream'
      : scope === 'download-album'
        ? 'download/album'
        : 'download/track'
  const url = new URL(
    `${useAppStore.getState().data.url}/api/${route}/${encodeURIComponent(id)}`,
  )
  url.searchParams.set('ticket', ticket)
  if (format && format !== 'raw') url.searchParams.set('format', format)
  return url.toString()
}
export async function getSongStreamUrl(
  id: string,
  _bitrate?: string,
  format?: string,
  _cacheBust?: string,
) {
  const target = await mediaUrl(id, 'stream', format)
  return window.api?.supernovaRequest
    ? `supernova-media://stream/?target=${encodeURIComponent(target)}`
    : target
}
export function getDownloadUrl(id: string, kind: 'track' | 'album' = 'track') {
  return mediaUrl(id, kind === 'album' ? 'download-album' : 'download-track')
}
