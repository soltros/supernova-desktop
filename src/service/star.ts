import { invalidateFavorites } from '@/api/favorites'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/utils/queryKeys'
import { request } from '@/api/httpClient'
async function starItem(
  id: string,
  entityType = 'track',
  metadata?: Record<string, unknown>,
) {
  await request('/api/hearts', {
    method: 'POST',
    body: JSON.stringify({ entity_type: entityType, entity_id: id, metadata }),
  })
  invalidateFavorites()
  queryClient.invalidateQueries({ queryKey: [queryKeys.favorites.songs] })
}
async function unstarItem(id: string, entityType = 'track') {
  await request('/api/hearts', {
    method: 'DELETE',
    query: { entity_type: entityType, entity_id: id },
  })
  invalidateFavorites()
  queryClient.invalidateQueries({ queryKey: [queryKeys.favorites.songs] })
}
async function handleStarItem({
  id,
  starred,
  entityType = 'track',
  metadata,
}: {
  id: string
  starred: boolean
  entityType?: string
  metadata?: Record<string, unknown>
}) {
  return starred
    ? unstarItem(id, entityType)
    : starItem(id, entityType, metadata)
}
export const star = { starItem, unstarItem, handleStarItem }
