import { ISong } from './song'

export interface Playlist {
  id: string
  name: string
  comment: string
  songCount: number
  duration: number
  public: boolean
  owner: string
  created: string
  changed: string
  coverArt: string
}

export interface Playlists {
  playlist: Playlist[]
}

export interface PlaylistWithEntries extends Playlist {
  entry: ISong[]
}

export interface UpdateParams {
  playlistId: string
  name?: string
  comment?: string
  isPublic?: 'true' | 'false'
  songIdToAdd?: string | string[]
  songIndexToRemove?: string | string[]
}

export interface CreateParams {
  name: string
  comment: string
  isPublic: 'true' | 'false'
  songIdToAdd?: string | string[]
}
