import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useDebounce } from 'use-debounce'
import { AlbumGridCard } from '@/app/components/albums/album-grid-card'
import { ROUTES } from '@/routes/routesList'
import { supernova } from '@/service/supernova'
import { usePlayerActions } from '@/store/player.store'
import { queryKeys } from '@/utils/queryKeys'

export default function MobileSearch() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const input = params.get('q') ?? ''
  const [query] = useDebounce(input.trim(), 250)
  const { playSong } = usePlayerActions()
  const { data, isFetching, isError } = useQuery({
    queryKey: [queryKeys.search, 'mobile', query],
    queryFn: () =>
      supernova.search.get({
        query,
        albumCount: 8,
        artistCount: 8,
        songCount: 12,
      }),
    enabled: query.length > 0,
  })
  const results = query === input.trim() ? data : undefined
  const albums = results?.album ?? []
  const artists = results?.artist ?? []
  const songs = results?.song ?? []

  function updateSearch(value: string) {
    setParams(value ? { q: value } : {}, {
      replace: true,
      preventScrollReset: true,
    })
  }

  return (
    <section className="mobile-page">
      <h1 className="mobile-page-title">{t('sidebar.search')}</h1>
      <div className="mobile-search-field">
        <Search size={19} aria-hidden />
        <input
          aria-label={t('sidebar.search')}
          placeholder={t('sidebar.search')}
          type="search"
          autoComplete="off"
          value={input}
          onChange={(event) => updateSearch(event.target.value)}
        />
        {input && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => updateSearch('')}
          >
            <X size={19} />
          </button>
        )}
      </div>
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {isError && 'Couldn’t search your library. Try again.'}
        {!isFetching &&
          results &&
          !albums.length &&
          !artists.length &&
          !songs.length &&
          t('command.noResults')}
      </div>
      {albums.length > 0 && (
        <section>
          <div className="mobile-section-heading">
            <h2>{t('sidebar.albums')}</h2>
            <Link to={ROUTES.ALBUMS.SEARCH(query)}>{t('generic.seeMore')}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {albums.map((album) => (
              <AlbumGridCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
      {songs.length > 0 && (
        <section>
          <div className="mobile-section-heading">
            <h2>{t('sidebar.songs')}</h2>
            <Link to={ROUTES.SONGS.SEARCH(query)}>{t('generic.seeMore')}</Link>
          </div>
          <div className="mobile-list">
            {songs.map((song) => (
              <button
                key={song.id}
                type="button"
                className="mobile-list-row text-left"
                onClick={() => playSong(song)}
              >
                <span className="min-w-0">
                  <span className="block truncate">{song.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {song.artist}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      {artists.length > 0 && (
        <section>
          <div className="mobile-section-heading">
            <h2>{t('sidebar.artists')}</h2>
          </div>
          <div className="mobile-list">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={ROUTES.ARTIST.PAGE(artist.id)}
                className="mobile-list-row"
              >
                <span className="truncate">{artist.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
