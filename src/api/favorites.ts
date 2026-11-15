import { request } from './httpClient'
import { useAppStore } from '@/store/app.store'
interface Heart {
  entity_type: string
  entity_id: string
  created_at: string
}
let cache:
  | { key: string; expires: number; items: Map<string, string> }
  | undefined
let pending: { key: string; promise: Promise<void> } | undefined
let generation = 0
function sessionKey() {
  const { url, token } = useAppStore.getState().data
  return `${url}|${token}`
}
export function invalidateFavorites() {
  generation++
  cache = undefined
  pending = undefined
}
export async function loadFavorites(): Promise<void> {
  const key = sessionKey()
  if (cache?.key === key && cache.expires > Date.now()) return
  if (pending?.key === key) return pending.promise
  const version = generation
  const promise = (async () => {
    const hearts = (await request<Heart[] | null>('/api/hearts')) || []
    if (version === generation && key === sessionKey())
      cache = {
        key,
        expires: Date.now() + 30000,
        items: new Map(
          hearts.map((h) => [`${h.entity_type}:${h.entity_id}`, h.created_at]),
        ),
      }
  })()
  pending = { key, promise }
  try {
    await promise
  } finally {
    if (pending?.promise === promise) pending = undefined
  }
}
export function favoriteDate(type: string, id: string): string | undefined {
  return cache?.key === sessionKey()
    ? cache.items.get(`${type}:${id}`)
    : undefined
}
