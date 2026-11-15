import { request } from '@/api/httpClient'
import {
  NativePlaylist,
  NativeTrack,
  playlistModel,
  songModel,
  unsupported,
} from '@/api/models'
import type { UpdateParams, CreateParams } from '@/types/responses/playlist'
async function getAll() {
  return ((await request<NativePlaylist[] | null>('/api/playlists')) || []).map(
    playlistModel,
  )
}
async function getOne(id: string) {
  const p = (await getAll()).find((p) => p.id === id)
  if (!p) throw new Error('Playlist not found')
  const tracks =
    (await request<NativeTrack[] | null>(
      `/api/playlists/${encodeURIComponent(id)}/tracks`,
    )) || []
  return {
    ...p,
    entry: tracks.map((t) => songModel(t)),
    songCount: tracks.length,
    duration: tracks.reduce((n, t) => n + t.duration_ms / 1000, 0),
  }
}
async function remove(id: string) {
  await request(`/api/playlists/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
async function create(name: string, tracks: string[] = []) {
  const p = await request<NativePlaylist>('/api/playlists', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  try {
    for (const track_id of tracks)
      await request(`/api/playlists/${encodeURIComponent(p.id)}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ track_id }),
      })
  } catch (error) {
    await remove(p.id)
    throw error
  }
  return playlistModel(p)
}
async function update({
  playlistId,
  name,
  comment,
  isPublic,
  songIdToAdd,
  songIndexToRemove,
}: UpdateParams) {
  if (name !== undefined || comment || isPublic === 'true')
    return unsupported('Playlist metadata editing and public playlists')
  const path = `/api/playlists/${encodeURIComponent(playlistId)}/tracks`
  const adds = songIdToAdd
    ? Array.isArray(songIdToAdd)
      ? songIdToAdd
      : [songIdToAdd]
    : []
  const removes = songIndexToRemove
    ? Array.isArray(songIndexToRemove)
      ? songIndexToRemove
      : [songIndexToRemove]
    : []
  if (removes.length) {
    const p = await getOne(playlistId)
    for (const index of removes) {
      const t = p.entry[Number(index)]
      if (!t) throw new Error('Playlist entry no longer exists')
      if (p.entry.filter((s) => s.id === t.id).length > 1)
        return unsupported('Removing an individual repeated playlist entry')
      await request(`${path}/${encodeURIComponent(t.id)}`, { method: 'DELETE' })
    }
  }
  for (const track_id of adds)
    await request(path, { method: 'POST', body: JSON.stringify({ track_id }) })
}
async function createWithDetails(data: CreateParams) {
  if (data.comment || data.isPublic === 'true')
    return unsupported('Public playlists and comments')
  return create(
    data.name,
    data.songIdToAdd
      ? Array.isArray(data.songIdToAdd)
        ? data.songIdToAdd
        : [data.songIdToAdd]
      : [],
  )
}
export const playlists = {
  getAll,
  getOne,
  remove,
  create,
  update,
  createWithDetails,
}
