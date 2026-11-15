import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Link } from 'react-router-dom'
import { Dot } from '@/app/components/dot'
import { ImageLoader } from '@/app/components/image-loader'
import { ROUTES } from '@/routes/routesList'
import { IFeaturedArtist } from '@/types/responses/artist'
import { ALBUM_ARTISTS_MAX_NUMBER } from '@/utils/multipleArtists'

type AlbumArtistProps = {
  id: string
  name: string
}

export function AlbumArtistInfo({ id, name }: AlbumArtistProps) {
  return (
    <div className="flex items-center gap-2">
      <ArtistImage id={id} name={name} />
      <ArtistLink id={id} name={name} />
    </div>
  )
}

type MultipleArtistsInfoProps = { artists: IFeaturedArtist[] }

export function AlbumMultipleArtistsInfo({
  artists,
}: MultipleArtistsInfoProps) {
  const data = artists.slice(0, ALBUM_ARTISTS_MAX_NUMBER)

  return (
    <div className="flex items-center gap-2">
      {true && (
        <div className="flex items-center -space-x-0.5">
          {data.map(({ id, name }) => (
            <div key={`artist-image-${id}`} className="rounded-full">
              <ArtistImage id={id} name={name} />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center">
        {data.map(({ id, name }, index) => (
          <div className="flex" key={`artist-link-${id}`}>
            <ArtistLink id={id} name={name} />
            {index < data.length - 1 && <Dot />}
          </div>
        ))}
      </div>
    </div>
  )
}

function ArtistImage({ id, name }: AlbumArtistProps) {
  return (
    <div className="size-6 min-w-6 min-h-6 rounded-full bg-accent">
      <ImageLoader id={id} type="artist" size={100}>
        {(src) => (
          <LazyLoadImage
            effect="opacity"
            src={src}
            alt={name}
            className="w-full h-full rounded-full aspect-square object-cover shadow-md"
          />
        )}
      </ImageLoader>
    </div>
  )
}

function ArtistLink({ id, name }: AlbumArtistProps) {
  return (
    <Link
      className="flex items-center hover:underline text-sm font-medium text-shadow-md"
      to={ROUTES.ARTIST.PAGE(id)}
    >
      {name}
    </Link>
  )
}
