import type { ISong } from '@/types/responses/song'
import type { Albums } from '@/types/responses/album'
import type { IArtist } from '@/types/responses/artist'
import type { Playlist } from '@/types/responses/playlist'
export interface NativeTrack {
  id: string
  title: string
  album_id: string
  artist_id?: string
  artist_name?: string
  duration_ms: number
  track_number: number
  disc_number: number
  bitrate: number
  format: string
  album_title?: string
}
export interface NativeAlbum {
  id: string
  title: string
  release_year: number
  artist_id?: string
  artist_name?: string
  musicbrainz_id?: string
  bio?: string
}
export interface NativeArtist {
  id: string
  name: string
  image_url?: string
  bio?: string
  musicbrainz_id?: string
}
export interface NativePlaylist {
  id: string
  name: string
  user_id: string
  created_at: string
}
export function songModel(t: NativeTrack, album?: NativeAlbum): ISong {
  return {
    id: t.id,
    parent: t.album_id,
    isDir: false,
    title: t.title,
    album: album?.title || t.album_title || '',
    artist: t.artist_name || album?.artist_name || '',
    track: t.track_number,
    year: album?.release_year || 0,
    coverArt: t.album_id,
    size: 0,
    contentType: `audio/${t.format}`,
    suffix: t.format,
    duration: t.duration_ms / 1000,
    bitRate: t.bitrate,
    path: '',
    discNumber: t.disc_number,
    created: '',
    albumId: t.album_id,
    artistId: t.artist_id,
    type: 'music',
    isVideo: false,
    bpm: 0,
    comment: '',
    sortName: t.title,
    mediaType: 'song',
    musicBrainzId: '',
    genres: [],
    replayGain: { trackGain: 0, trackPeak: 1, albumGain: 0, albumPeak: 1 },
  }
}
export function albumModel(a: NativeAlbum): Albums {
  return {
    id: a.id,
    name: a.title,
    artist: a.artist_name || '',
    artistId: a.artist_id,
    coverArt: a.id,
    songCount: 0,
    duration: 0,
    created: '',
    year: a.release_year,
    genre: '',
    userRating: 0,
    genres: [],
    musicBrainzId: a.musicbrainz_id || '',
    isCompilation: false,
    sortName: a.title,
    discTitles: [],
  }
}
export function artistModel(a: NativeArtist): IArtist {
  return {
    id: a.id,
    name: a.name,
    coverArt: a.id,
    albumCount: 0,
    artistImageUrl: a.image_url || '',
    musicBrainzId: a.musicbrainz_id,
  }
}
export function playlistModel(p: NativePlaylist): Playlist {
  return {
    id: p.id,
    name: p.name,
    comment: '',
    songCount: 0,
    duration: 0,
    public: false,
    owner: p.user_id,
    created: p.created_at,
    changed: p.created_at,
    coverArt: '',
  }
}
export function unsupported(feature: string): never {
  throw new Error(`${feature} is not exposed by the Supernova API.`)
}
