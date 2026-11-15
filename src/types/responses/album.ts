import { IFeaturedArtist } from './artist'
import { ISong } from './song'

export interface Genre {
  name: string
}

interface RecordLabel {
  name: string
}

export interface DiscTitle {
  disc: number
}

export interface ReleaseDate {}

export interface SingleAlbum {
  id: string
  name: string
  artist: string
  artistId?: string
  coverArt: string
  songCount: number
  duration: number
  playCount?: number
  created: string
  starred?: string
  year?: number
  genre: string
  played?: string
  userRating: number
  genres: Genre[]
  musicBrainzId: string
  isCompilation: boolean
  sortName: string
  discTitles: DiscTitle[]
  originalReleaseDate?: ReleaseDate
  releaseDate?: ReleaseDate
  releaseTypes?: string[]
  recordLabels?: RecordLabel[]
  moods?: string[]
  artists?: IFeaturedArtist[]
  displayArtist?: string
  explicitStatus?: string
  version?: string
  song: ISong[]
}

export type Albums = Omit<SingleAlbum, 'song'>

export interface AlbumList {
  album: Albums[]
}

export interface IAlbumInfo {
  notes?: string
  musicBrainzId?: string
  lastFmUrl?: string
  smallImageUrl?: string
  mediumImageUrl?: string
  largeImageUrl?: string
}

export type AlbumListType =
  | 'random'
  | 'newest'
  | 'frequent'
  | 'recent'
  | 'byGenre'
  | 'alphabeticalByName'
  | 'alphabeticalByArtist'
  | 'starred'
  | 'byYear'
  | 'search'

export interface AlbumsListData {
  albumsCount: number
  list: Albums[]
}
