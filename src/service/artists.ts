import { loadFavorites } from '@/api/favorites'
import type { IArtistInfo } from '@/types/responses/artist'
import { pages, request } from '@/api/httpClient'
import {
  NativeArtist,
  NativeTrack,
  NativeAlbum,
  artistModel,
  albumModel,
} from '@/api/models'
async function getAll() {
  await loadFavorites()
  const [artists, albums] = await Promise.all([
    pages<NativeArtist>('/api/artists'),
    pages<NativeAlbum>('/api/albums'),
  ])
  const counts = new Map<string, number>()
  for (const album of albums)
    if (album.artist_id)
      counts.set(album.artist_id, (counts.get(album.artist_id) || 0) + 1)
  return artists.map((a) => ({
    ...artistModel(a),
    albumCount: counts.get(a.id) || 0,
  }))
}
async function getOne(id: string) {
  await loadFavorites()
  const [a, list, tracks] = await Promise.all([
    request<NativeArtist>(`/api/artists/${encodeURIComponent(id)}`),
    pages<NativeAlbum>('/api/albums', { artist_id: id }),
    pages<NativeTrack>('/api/tracks', { artist_id: id }),
  ])
  const stats = new Map<string, { count: number; duration: number }>()
  for (const track of tracks) {
    const stat = stats.get(track.album_id) || { count: 0, duration: 0 }
    stat.count++
    stat.duration += track.duration_ms / 1000
    stats.set(track.album_id, stat)
  }
  return {
    ...artistModel(a),
    album: list.map((album) => ({
      ...albumModel(album),
      songCount: stats.get(album.id)?.count || 0,
      duration: stats.get(album.id)?.duration || 0,
    })),
    albumCount: list.length,
  }
}
async function getInfo(id: string): Promise<IArtistInfo> {
  const a = await request<NativeArtist>(
    `/api/artists/${encodeURIComponent(id)}`,
  )
  return {
    biography: a.bio,
    musicBrainzId: a.musicbrainz_id,
    smallImageUrl: a.image_url,
    mediumImageUrl: a.image_url,
    largeImageUrl: a.image_url,
    similarArtist: [],
  }
}
export const artists = { getAll, getOne, getInfo }
