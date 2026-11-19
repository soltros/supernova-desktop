import { request } from '@/api/httpClient'
import { useAppStore } from '@/store/app.store'
import type { ISong } from '@/types/responses/song'
import { getPlugins } from './plugins'

let availability:
  | { token: string; expires: number; enabled: boolean }
  | undefined

export function lastFmCallback() {
  return new URL(useAppStore.getState().data.url + '/api/health')
}

export function authorizeLastFm() {
  return request<{ url: string }>('/api/plugins/lastfm/auth-url', {
    query: { cb: lastFmCallback().href },
  })
}

export async function connectLastFm(callback: string) {
  const expected = lastFmCallback()
  const actual = new URL(callback.trim())
  const token = actual.searchParams.get('token')
  if (
    actual.origin !== expected.origin ||
    actual.pathname !== expected.pathname ||
    !token
  )
    throw new Error(
      'Paste the full address you reached after approving Last.fm.',
    )
  const result = await request<{ session_key: string }>(
    '/api/plugins/lastfm/session',
    {
      method: 'POST',
      body: JSON.stringify({ token }),
    },
  )
  if (!result.session_key) throw new Error('Last.fm did not return a session.')
  useAppStore.setState((state) => {
    state.data.lastFmSession = result.session_key
  })
}

export async function sendLastFm(song: ISong, submission: boolean) {
  const { lastFmSession, token } = useAppStore.getState().data
  if (!lastFmSession || !token || !song.artist || !song.title) return
  if (availability?.token !== token || availability.expires <= Date.now()) {
    const plugins = await getPlugins()
    availability = {
      token,
      expires: Date.now() + 60_000,
      enabled: plugins.some(({ id, enabled }) => id === 'lastfm' && enabled),
    }
  }
  const current = useAppStore.getState().data
  if (
    !availability.enabled ||
    current.token !== token ||
    current.lastFmSession !== lastFmSession
  )
    return
  await request(
    `/api/plugins/lastfm/${submission ? 'scrobble' : 'nowplaying'}`,
    {
      method: 'POST',
      body: JSON.stringify({
        session_key: lastFmSession,
        artist: song.artist,
        track: song.title,
        ...(submission ? { timestamp: Math.floor(Date.now() / 1000) } : {}),
      }),
    },
  )
}
