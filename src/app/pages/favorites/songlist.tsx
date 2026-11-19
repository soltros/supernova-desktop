import { usePluginEnabled } from '@/app/hooks/use-server-plugins'
import { Button } from '@/app/components/ui/button'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { useTranslation } from 'react-i18next'
import { ShadowHeader } from '@/app/components/album/shadow-header'
import { InfinitySongListFallback } from '@/app/components/fallbacks/song-fallbacks'
import { HeaderTitle } from '@/app/components/header-title'
import { DataTableList } from '@/app/components/ui/data-table-list'
import { useFavoriteSongs } from '@/app/hooks/use-favorite-songs'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'

export default function SongList() {
  const { t } = useTranslation()
  const columns = songsColumns()
  const podcastsEnabled = usePluginEnabled('podcasts')
  const { setSongList, setPlayRadio } = usePlayerActions()

  const { data, isLoading } = useFavoriteSongs()

  if (isLoading) {
    return <InfinitySongListFallback />
  }
  if (!data) return null

  const songlist = data.songs
  const songCount = data.songs.length

  function handlePlaySong(index: number) {
    if (songlist) {
      setSongList(songlist, index, false, {
        type: 'favourite',
        id: 'favourite',
        name: t('sidebar.favorites'),
      })
    }
  }

  const columnsToShow: ColumnFilter[] = [
    'index',
    'title',
    'album',
    'duration',
    'playCount',
    'played',
    'contentType',
    'select',
  ]

  const title = t('sidebar.favorites')

  const groups = [
    {
      title: t('sidebar.albums'),
      items: data.album.map(({ id, name }) => ({
        id,
        name,
        route: ROUTES.ALBUM.PAGE(id),
      })),
    },
    {
      title: t('sidebar.artists'),
      items: data.artist.map(({ id, name }) => ({
        id,
        name,
        route: ROUTES.ARTIST.PAGE(id),
      })),
    },
    {
      title: t('sidebar.playlists'),
      items: data.playlists.map(({ id, name }) => ({
        id,
        name,
        route: ROUTES.PLAYLIST.PAGE(id),
      })),
    },
    {
      title: t('sidebar.podcasts'),
      items: podcastsEnabled
        ? data.podcasts.map(({ id, title }) => ({
            id,
            name: title,
            route: ROUTES.PODCASTS.PAGE(id),
          }))
        : [],
    },
  ]

  return (
    <div className="w-full">
      <ShadowHeader
        showGlassEffect={false}
        fixed={false}
        className="relative w-full justify-between items-center"
      >
        <HeaderTitle title={title} count={songCount} loading={isLoading} />
      </ShadowHeader>

      <div className="space-y-2 px-4 py-3">
        {groups
          .filter(({ items }) => items.length)
          .map(({ title, items }) => (
            <details key={title} className="rounded-xl border px-3">
              <summary className="cursor-pointer py-3 font-medium">
                {title} ({items.length})
              </summary>
              <div className="divide-y">
                {items.map(({ id, name, route }) => (
                  <Link
                    key={id}
                    to={route}
                    className="block py-3 hover:text-primary"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        {data.radio.length > 0 && (
          <details className="rounded-xl border px-3">
            <summary className="cursor-pointer py-3 font-medium">
              {t('sidebar.radios')} ({data.radio.length})
            </summary>
            {data.radio.map((station, index) => (
              <Button
                key={station.id}
                variant="ghost"
                className="block w-full text-left"
                onClick={() => setPlayRadio(data.radio, index)}
              >
                {station.name}
              </Button>
            ))}
          </details>
        )}
      </div>
      <div className="h-content min-h-64 w-full overflow-x-auto">
        <DataTableList
          columns={columns}
          data={songlist}
          handlePlaySong={(row) => handlePlaySong(row.index)}
          columnFilter={columnsToShow}
          noRowsMessage={t('favorites.noSongList')}
        />
      </div>
    </div>
  )
}
