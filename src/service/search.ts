import { loadFavorites } from '@/api/favorites'
import { pages, request } from '@/api/httpClient'
import {
  NativeTrack,
  NativeAlbum,
  NativeArtist,
  songModel,
  albumModel,
  artistModel,
} from '@/api/models'
export interface SearchQueryOptions {
  query?: string
  artistCount?: number
  artistOffset?: number
  albumCount?: number
  albumOffset?: number
  songCount?: number
  songOffset?: number
}
async function get({
  query = '',
  artistCount = 20,
  artistOffset = 0,
  albumCount = 20,
  albumOffset = 0,
  songCount = 20,
  songOffset = 0,
}: SearchQueryOptions) {
  await loadFavorites()
  if (query) {
    const d = await request<{
      tracks: NativeTrack[]
      albums: NativeAlbum[]
      artists: NativeArtist[]
    }>('/api/search', { query: { q: query } })
    return {
      song: (d.tracks || [])
        .slice(songOffset, songOffset + songCount)
        .map((t) => songModel(t)),
      album: (d.albums || [])
        .slice(albumOffset, albumOffset + albumCount)
        .map(albumModel),
      artist: (d.artists || [])
        .slice(artistOffset, artistOffset + artistCount)
        .map(artistModel),
    }
  }
  const [tracks, albums, artists] = await Promise.all([
    songCount
      ? pages<NativeTrack>('/api/tracks', {}, songCount, songOffset)
      : [],
    albumCount
      ? pages<NativeAlbum>('/api/albums', {}, albumCount, albumOffset)
      : [],
    artistCount
      ? pages<NativeArtist>('/api/artists', {}, artistCount, artistOffset)
      : [],
  ])
  return {
    song: tracks.map((t) => songModel(t)),
    album: albums.map(albumModel),
    artist: artists.map(artistModel),
  }
}
export const search = { get }
