import { Albums } from './album'
import { ISimilarArtist } from './artist'
import { ISong } from './song'

export interface Search {
  artist?: ISimilarArtist[]
  album?: Albums[]
  song?: ISong[]
}
