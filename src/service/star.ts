import { request } from '@/api/httpClient'
async function starItem(id: string, entityType = 'track') {
  await request('/api/hearts', {
    method: 'POST',
    body: JSON.stringify({ entity_type: entityType, entity_id: id }),
  })
}
async function unstarItem(id: string, entityType = 'track') {
  await request('/api/hearts', {
    method: 'DELETE',
    query: { entity_type: entityType, entity_id: id },
  })
}
async function handleStarItem({
  id,
  starred,
  entityType = 'track',
}: {
  id: string
  starred: boolean
  entityType?: string
}) {
  return starred ? unstarItem(id, entityType) : starItem(id, entityType)
}
export const star = { starItem, unstarItem, handleStarItem }
