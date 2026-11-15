import { useQuery } from '@tanstack/react-query'
import { supernova } from '@/service/supernova'
import { convertMinutesToMs } from '@/utils/convertSecondsToTime'
import { queryKeys } from '@/utils/queryKeys'

export const useGetRandomSongs = () => {
  return useQuery({
    queryKey: [queryKeys.song.random],
    queryFn: () => supernova.songs.getRandomSongs({ size: 10 }),
  })
}

export const useGetRecentlyAdded = () => {
  return useQuery({
    queryKey: [queryKeys.album.recentlyAdded],
    queryFn: () =>
      supernova.albums.getAlbumList({
        size: 16,
        type: 'newest',
      }),
  })
}

export const useGetMostPlayed = () => {
  return useQuery({
    queryKey: [queryKeys.album.mostPlayed],
    queryFn: () =>
      supernova.albums.getAlbumList({
        size: 16,
        type: 'frequent',
      }),
  })
}

export const useGetRecentlyPlayed = () => {
  return useQuery({
    queryKey: [queryKeys.album.recentlyPlayed],
    queryFn: () =>
      supernova.albums.getAlbumList({
        size: 16,
        type: 'recent',
      }),
    refetchInterval: convertMinutesToMs(2),
  })
}

export const useGetRandomAlbums = () => {
  return useQuery({
    queryKey: [queryKeys.album.random],
    queryFn: () =>
      supernova.albums.getAlbumList({
        size: 16,
        type: 'random',
      }),
  })
}
