import { useQuery } from '@tanstack/react-query'
import { supernova } from '@/service/supernova'
import { queryKeys } from '@/utils/queryKeys'

export const useGetArtist = (artistId: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.single, artistId],
    queryFn: () => supernova.artists.getOne(artistId),
    enabled: !!artistId,
  })
}

export const useGetArtistInfo = (artistId: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.info, artistId],
    queryFn: () => supernova.artists.getInfo(artistId),
    enabled: !!artistId,
  })
}

export const useGetTopSongs = (artistName?: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.topSongs, artistName],
    queryFn: () => supernova.songs.getTopSongs(artistName ?? ''),
    enabled: !!artistName,
  })
}
