import type { IAlbumInfo } from '@/types/responses/album'
import { pages, request } from '@/api/httpClient'
import {
  NativeAlbum,
  NativeTrack,
  albumModel,
  songModel,
  unsupported,
} from '@/api/models'
import type { AlbumListType } from '@/types/responses/album'
export interface AlbumListParams {
  type: AlbumListType
  size?: number
  offset?: number
  fromYear?: string
  toYear?: string
  genre?: string
}
async function getAlbumList({
  type = 'alphabeticalByName',
  size = 30,
  offset = 0,
}: Partial<AlbumListParams> = {}) {
  if (type === 'byGenre') return unsupported('Genre filtering')
  let list: NativeAlbum[]
  if (type === 'newest') {
    const d = await request<{ recently_added_albums: NativeAlbum[] }>(
      '/api/dashboard',
    )
    list = d.recently_added_albums || []
  } else if (type === 'starred') {
    const d = await request<{ albums: NativeAlbum[] }>('/api/hearts/details')
    list = d.albums || []
  } else if (type === 'recent') {
    const d = await request<NativeTrack[] | null>('/api/scrobbles/recent')
    const ids = [...new Set((d || []).map((t) => t.album_id))]
    list = await Promise.all(
      ids.map((id) =>
        request<NativeAlbum>(`/api/albums/${encodeURIComponent(id)}`),
      ),
    )
  } else if (type === 'frequent')
    return unsupported('Most-played album rankings')
  else {
    list = await pages<NativeAlbum>(
      '/api/albums',
      {},
      type === 'alphabeticalByName' ? size : Infinity,
      type === 'alphabeticalByName' ? offset : 0,
    )
    if (type === 'random')
      list = list
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((x) => x.value)
    if (type === 'alphabeticalByArtist')
      list.sort((a, b) =>
        (a.artist_name || '').localeCompare(b.artist_name || ''),
      )
    if (type === 'byYear') list.sort((a, b) => b.release_year - a.release_year)
    if (type === 'alphabeticalByName')
      return {
        list: list.map(albumModel),
        albumsCount: offset + list.length + (list.length === size ? 1 : 0),
      }
  }
  return {
    list: list.slice(offset, offset + size).map(albumModel),
    albumsCount: list.length,
  }
}
async function getOne(id: string) {
  const a = await request<NativeAlbum>(`/api/albums/${encodeURIComponent(id)}`)
  const tracks = await pages<NativeTrack>('/api/tracks', { album_id: id })
  return {
    ...albumModel(a),
    song: tracks.map((t) => songModel(t, a)),
    songCount: tracks.length,
    duration: tracks.reduce((n, t) => n + t.duration_ms / 1000, 0),
  }
}
async function getInfo(id: string): Promise<IAlbumInfo> {
  const a = await request<NativeAlbum>(`/api/albums/${encodeURIComponent(id)}`)
  return { notes: a.bio, musicBrainzId: a.musicbrainz_id }
}
export const albums = { getAlbumList, getOne, getInfo }
