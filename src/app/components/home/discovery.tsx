import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { request } from '@/api/httpClient'
import { ROUTES } from '@/routes/routesList'
import { useAppStore } from '@/store/app.store'

interface Release {
  collectionName: string
  artistName: string
  artworkUrl100: string
  collectionViewUrl: string
}

interface SimilarArtist {
  id?: string
  name: string
  basedOn: string
  image?: string
}

function webUrl(value?: string) {
  return value && /^https:\/\//i.test(value) ? value : undefined
}

export function Discovery() {
  const token = useAppStore((state) => state.data.token)
  const { data } = useQuery({
    queryKey: ['supernova-discovery'],
    queryFn: () =>
      request<{
        release_radar: Release[] | null
        similar_artists: SimilarArtist[] | null
      }>('/api/discovery'),
    enabled: Boolean(token),
    staleTime: 15 * 60_000,
    retry: false,
  })
  const releases = data?.release_radar ?? []
  const artists = data?.similar_artists ?? []
  if (!releases.length && !artists.length) return null

  return (
    <div className="space-y-6 pt-6">
      {releases.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold tracking-tight">
            Release Radar
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from(
              new Map(
                releases.map((release) => [release.collectionViewUrl, release]),
              ).values(),
            ).map((release) => (
              <a
                className="w-36 shrink-0"
                key={release.collectionViewUrl}
                href={webUrl(release.collectionViewUrl)}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="aspect-square w-full rounded-xl bg-muted object-cover"
                  src={webUrl(release.artworkUrl100)}
                  alt=""
                  loading="lazy"
                />
                <div className="truncate font-medium">
                  {release.collectionName}
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {release.artistName}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
      {artists.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold tracking-tight">
            Similar Artists
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from(
              new Map(artists.map((artist) => [artist.name, artist])).values(),
            ).map((artist) => (
              <Link
                className="w-36 shrink-0"
                key={artist.name}
                to={
                  artist.id
                    ? ROUTES.ARTIST.PAGE(artist.id)
                    : `${ROUTES.SEARCH}?q=${encodeURIComponent(artist.name)}`
                }
              >
                <img
                  className="aspect-square w-full rounded-xl bg-muted object-cover"
                  src={webUrl(artist.image)}
                  alt=""
                  loading="lazy"
                />
                <div className="truncate font-medium">{artist.name}</div>
                <div className="truncate text-sm text-muted-foreground">
                  Similar to {artist.basedOn}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
