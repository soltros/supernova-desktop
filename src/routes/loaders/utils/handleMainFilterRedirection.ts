import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { AlbumListType } from '@/types/responses/album'
import {
  AlbumsSearchParams,
  AlbumsFilters,
  PersistedAlbumListKeys,
} from '@/utils/albumsFilter'

export function handleMainFilterRedirection(searchParams: URLSearchParams) {
  const savedFilter = localStorage.getItem(
    PersistedAlbumListKeys.MainFilter,
  ) as AlbumListType | null

  const unsupported = [AlbumsFilters.ByGenre, AlbumsFilters.MostPlayed]
  const current = searchParams.get(AlbumsSearchParams.MainFilter)
  if (
    (current && unsupported.includes(current as AlbumsFilters)) ||
    (savedFilter && unsupported.includes(savedFilter as AlbumsFilters))
  ) {
    localStorage.removeItem(PersistedAlbumListKeys.MainFilter)
    return redirect(ROUTES.ALBUMS.GENERIC(AlbumsFilters.ByName))
  }
  const hasMainFilter = searchParams.has(AlbumsSearchParams.MainFilter)

  if (savedFilter && !hasMainFilter) {
    return redirect(ROUTES.ALBUMS.GENERIC(savedFilter))
  }

  return null
}
