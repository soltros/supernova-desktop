import { pages, request } from '@/api/httpClient'
import {
  NativeTrack,
  NativeAlbum,
  NativeArtist,
  songModel,
  albumModel,
  artistModel,
} from '@/api/models'
async function getAllSongs(count = Infinity) {
  return (await pages<NativeTrack>('/api/tracks', {}, count)).map((t) =>
    songModel(t),
  )
}
async function getSong(id: string) {
  const tracks = await pages<NativeTrack>('/api/tracks')
  const t = tracks.find((t) => t.id === id)
  if (!t) throw new Error('Track not found')
  return songModel(t)
}
async function getRandomSongs({
  size = 10,
}: {
  size?: number
  genre?: string
  fromYear?: number
  toYear?: number
}) {
  const tracks = await getAllSongs()
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
  }
  return tracks.slice(0, size)
}
async function getFavoriteSongs() {
  const d = await request<{
    tracks: NativeTrack[]
    albums: NativeAlbum[]
    artists: NativeArtist[]
  }>('/api/hearts/details')
  const starred = new Date().toISOString()
  return {
    song: (d.tracks || []).map((t) => ({ ...songModel(t), starred })),
    album: (d.albums || []).map((a) => ({ ...albumModel(a), starred })),
    artist: (d.artists || []).map((a) => ({ ...artistModel(a), starred })),
  }
}
async function getTopSongs(name: string) {
  const artists = await pages<NativeArtist>('/api/artists')
  const artist = artists.find((a) => a.name === name)
  return artist
    ? (
        await pages<NativeTrack>('/api/tracks', { artist_id: artist.id }, 50)
      ).map((t) => songModel(t))
    : []
}
async function getArtistSongs(id:string){return (await pages<NativeTrack>('/api/tracks',{artist_id:id})).map(t=>songModel(t))}
export const songs = {
  getArtistSongs,
  getAllSongs,
  getSong,
  getRandomSongs,
  getFavoriteSongs,
  getTopSongs,
}
