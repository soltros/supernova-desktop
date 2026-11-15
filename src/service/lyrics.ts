import { request } from '@/api/httpClient'
import type { ILyric } from '@/types/responses/song'
interface LyricsData {
  id: string
  artist: string
  title: string
  album?: string
  duration?: number
}
async function getLyrics(d: LyricsData): Promise<ILyric> {
  const result = await request<{ syncedLyrics?: string; plainLyrics?: string }>(
    '/api/plugins/lrclib/lyrics',
    {
      query: {
        artist_name: d.artist,
        track_name: d.title,
        album_name: d.album,
        duration: d.duration,
      },
    },
  )
  return {
    artist: d.artist,
    title: d.title,
    value: result.syncedLyrics || result.plainLyrics || '',
    lang: 'und',
  }
}
export const lyrics = { getLyrics, getLyricsFromLRCLib: getLyrics }
