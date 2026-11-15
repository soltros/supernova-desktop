import { supernova } from '@/service/supernova'

export function useSongList() {
  async function getArtistSongCount(id:string) {
    return (await supernova.songs.getArtistSongs(id)).length
  }
  async function getArtistAllSongs(name:string) {
    const artist=(await supernova.artists.getAll()).find(a=>a.name===name)
    return artist?supernova.songs.getArtistSongs(artist.id):[]
  }

  async function getAlbumSongs(albumId: string) {
    const songs = await supernova.albums.getOne(albumId)

    if (!songs || !songs.song) return undefined

    return songs.song
  }

  return {
    getArtistSongCount,
    getArtistAllSongs,
    getAlbumSongs,
  }
}
