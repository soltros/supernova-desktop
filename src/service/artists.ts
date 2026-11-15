import type { IArtistInfo } from '@/types/responses/artist'
import { pages, request } from '@/api/httpClient'
import {
  NativeArtist,
  NativeAlbum,
  artistModel,
  albumModel,
} from '@/api/models'
async function getAll() {
  return (await pages<NativeArtist>('/api/artists')).map((a) => ({
    ...artistModel(a),
    albumCount: 0,
  }))
}
async function getOne(id: string) {
  const a = await request<NativeArtist>(
    `/api/artists/${encodeURIComponent(id)}`,
  )
  const list = await pages<NativeAlbum>('/api/albums', { artist_id: id })
  return {
    ...artistModel(a),
    album: list.map(albumModel),
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
