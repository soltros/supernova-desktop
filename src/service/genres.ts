import { unsupported } from '@/api/models'
import type { Genre } from '@/types/responses/genre'
import type { ISong } from '@/types/responses/song'
async function get(): Promise<Genre[]> {
  return unsupported('Genres')
}
async function getSongsByGenre(_params: {
  genre: string
  count?: number
  offset?: number
}): Promise<ISong[]> {
  return unsupported('Genre filtering')
}
export const genres = { get, getSongsByGenre }
