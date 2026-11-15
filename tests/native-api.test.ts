import { invalidateFavorites } from '@/api/favorites'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { useAppStore } from '@/store/app.store'
import {
  getSongStreamUrl,
  getDownloadUrl,
  normalizeServerUrl,
  request,
} from '@/api/httpClient'
import { supernova } from '@/service/supernova'
import { podcasts } from '@/service/podcasts'
const fetchMock = vi.fn()
const track = {
  id: 'track-1',
  title: 'Track',
  album_id: 'album-1',
  artist_id: 'artist-1',
  artist_name: 'Artist',
  duration_ms: 123000,
  track_number: 1,
  disc_number: 1,
  bitrate: 320,
  format: 'mp3',
}
const album = {
  id: 'album-1',
  title: 'Album',
  release_year: 2026,
  artist_name: 'Artist',
  artist_id: 'artist-1',
}
function reply(data: unknown, status = 200) {
  return new Response(data === undefined ? null : JSON.stringify(data), {
    status,
  })
}
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  invalidateFavorites()
  localStorage.clear()
  useAppStore.setState((state) => {
    state.data.url = 'https://music.example'
    state.data.token = 'account-secret'
    state.data.isServerConfigured = true
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  delete (window as any).api
})
it('logs in with native JSON and persists a session token without a password', async () => {
  fetchMock.mockResolvedValue(
    reply({
      token: 'new-session',
      user: { username: 'alice', is_admin: true },
    }),
  )
  expect(
    await useAppStore.getState().actions.saveConfig({
      url: 'https://music.example/',
      username: 'alice',
      password: 'secret-password',
    }),
  ).toBe(true)
  const [url, options] = fetchMock.mock.calls[0]
  expect(String(url)).toBe('https://music.example/api/auth/login')
  expect(JSON.parse(options.body)).toEqual({
    username: 'alice',
    password: 'secret-password',
  })
  const data = useAppStore.getState().data
  expect(data.token).toBe('new-session')
  expect(data).not.toHaveProperty('password')
  expect(JSON.stringify(data)).not.toContain('secret-password')
})
it('requests scoped media tickets and never exposes bearer credentials in URLs', async () => {
  fetchMock.mockImplementation(() =>
    Promise.resolve(reply({ ticket: 'scoped-ticket' })),
  )
  const stream = await getSongStreamUrl('track-1')
  expect(stream).toBe(
    'https://music.example/api/stream/track-1?ticket=scoped-ticket',
  )
  expect(stream).not.toContain('account-secret')
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    scope: 'stream',
    resource: 'track-1',
  })
  expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(
    'Bearer account-secret',
  )
  const download = await getDownloadUrl('album-1', 'album')
  expect(download).toContain('/api/download/album/album-1?ticket=')
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).scope).toBe(
    'download-album',
  )
})
it('paginates beyond 1000 native tracks and converts milliseconds to seconds', async () => {
  fetchMock.mockImplementation((url: URL) => {
    const path = new URL(url)
    if (path.pathname === '/api/hearts') return Promise.resolve(reply([]))
    if (path.pathname.includes('/api/albums/'))
      return Promise.resolve(reply(album))
    return Promise.resolve(
      reply(
        path.searchParams.get('offset') === '0'
          ? Array.from({ length: 1000 }, (_, i) => ({
              ...track,
              id: String(i),
            }))
          : [track],
      ),
    )
  })
  const result = await supernova.albums.getOne('album-1')
  expect(result.song).toHaveLength(1001)
  expect(result.song[0].duration).toBe(123)
  expect(result.song[0].album).toBe('Album')
  expect(fetchMock).toHaveBeenCalledTimes(4)
})
it('uses typed heart mutations and preserves server failures', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
  await supernova.star.handleStarItem({
    id: 'artist-1',
    entityType: 'artist',
    starred: true,
  })
  const [url, options] = fetchMock.mock.calls[0]
  expect(String(url)).toContain('entity_type=artist')
  expect(String(url)).toContain('entity_id=artist-1')
  expect(options.method).toBe('DELETE')
  fetchMock.mockResolvedValue(new Response('Forbidden', { status: 403 }))
  await expect(supernova.star.starItem('track-1')).rejects.toThrow('Forbidden')
})
it('creates playlists using native POST mutations', async () => {
  fetchMock
    .mockResolvedValueOnce(
      reply(
        { id: 'playlist-1', name: 'Mix', user_id: 'user-1', created_at: '' },
        201,
      ),
    )
    .mockResolvedValue(reply(undefined, 201))
  await supernova.playlists.create('Mix', ['track-1', 'track-1'])
  expect(fetchMock).toHaveBeenCalledTimes(3)
  expect(
    fetchMock.mock.calls.every(
      ([url, options]) =>
        !String(url).includes('/rest/') && options.method === 'POST',
    ),
  ).toBe(true)
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
    track_id: 'track-1',
  })
})
it('does not silently pretend unsupported metadata edits succeeded', async () => {
  await expect(
    supernova.playlists.update({ playlistId: 'p', name: 'rename' }),
  ).rejects.toThrow('not exposed')
  expect(fetchMock).not.toHaveBeenCalled()
})
it('uses Supernova plugin episodes and progress in milliseconds', async () => {
  fetchMock.mockImplementation((url: URL) => {
    const path = new URL(url).pathname
    if (path.endsWith('/subscriptions'))
      return Promise.resolve(
        reply([
          {
            feed_id: '42',
            title: 'Podcast',
            feed_url: 'https://example.test/feed',
          },
        ]),
      )
    if (path.endsWith('/episodes'))
      return Promise.resolve(
        reply([
          {
            id: 7,
            title: 'Episode',
            description: '',
            enclosureUrl: 'https://example.test/audio.mp3',
            duration: 120,
            datePublished: 1700000000,
          },
        ]),
      )
    if (path.endsWith('/batch'))
      return Promise.resolve(
        reply({ '7': { position_ms: 12000, completed: false } }),
      )
    return Promise.resolve(reply(undefined))
  })
  const p = await podcasts.getOne('42')
  expect(p.episodes.data[0].audio_url).toBe('https://example.test/audio.mp3')
  expect(p.episodes.data[0].playback[0].progress).toBe(12)
  await podcasts.saveEpisodeProgress('42:7', 13.5)
  expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body)).toEqual({
    episode_id: '7',
    position_ms: 13500,
    completed: false,
  })
})
it('uses the isolated Electron bridge without browser CORS workarounds', async () => {
  const bridge = vi.fn().mockResolvedValue({
    status: 200,
    body: JSON.stringify({ ticket: 'desktop-ticket' }),
  })
  ;(window as any).api = { supernovaRequest: bridge }
  const stream = await getSongStreamUrl('track-1')
  expect(stream).toContain('supernova-media://stream/')
  const target = new URL(stream).searchParams.get('target')!
  expect(target).toBe(
    'https://music.example/api/stream/track-1?ticket=desktop-ticket',
  )
  expect(fetchMock).not.toHaveBeenCalled()
  expect(bridge.mock.calls[0][0].token).toBe('account-secret')
})
it('rejects active schemes and URL credentials and refuses protocol endpoints', async () => {
  for (const url of [
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://user:secret@example.test',
  ])
    expect(() => normalizeServerUrl(url)).toThrow()
  await expect(request('/rest/ping')).rejects.toThrow('native Supernova')
  expect(fetchMock).not.toHaveBeenCalled()
})
it('hydrates actual playlist counts, durations, and cover art', async () => {
  fetchMock.mockImplementation((url: URL) =>
    Promise.resolve(
      reply(
        new URL(url).pathname === '/api/playlists'
          ? [{ id: 'p', name: 'Mix', user_id: 'u', created_at: '' }]
          : [track, track],
      ),
    ),
  )
  const result = await supernova.playlists.getAll()
  expect(result[0]).toMatchObject({
    songCount: 2,
    duration: 246,
    coverArt: 'album-1',
  })
})
it('hydrates heart state and refreshes it after a mutation', async () => {
  fetchMock.mockImplementation((url: URL, options: RequestInit) => {
    if (options.method === 'DELETE') return Promise.resolve(reply(undefined))
    return Promise.resolve(
      reply(
        new URL(url).pathname === '/api/hearts'
          ? [
              {
                entity_type: 'track',
                entity_id: track.id,
                created_at: '2026-11-15',
              },
            ]
          : [track],
      ),
    )
  })
  const first = await supernova.search.get({
    artistCount: 0,
    albumCount: 0,
    songCount: 1,
  })
  expect(first.song[0].starred).toBe('2026-11-15')
  await supernova.star.unstarItem(track.id)
  fetchMock.mockImplementation((url: URL) =>
    Promise.resolve(
      reply(new URL(url).pathname === '/api/hearts' ? [] : [track]),
    ),
  )
  const second = await supernova.search.get({
    artistCount: 0,
    albumCount: 0,
    songCount: 1,
  })
  expect(second.song[0].starred).toBeUndefined()
})
it('rejects a late response when another account signs in', async () => {
  let resolve!: (response: Response) => void
  fetchMock.mockImplementation(
    () =>
      new Promise<Response>((done) => {
        resolve = done
      }),
  )
  const pending = request('/api/playlists')
  useAppStore.setState((state) => {
    state.data.token = 'other-account'
  })
  resolve(reply([]))
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
})
it('never sends an old account media ticket to a newly selected server', async () => {
  let resolve!: (response: Response) => void
  fetchMock.mockImplementation(
    () =>
      new Promise<Response>((done) => {
        resolve = done
      }),
  )
  const pending = getSongStreamUrl('track-1')
  useAppStore.setState((state) => {
    state.data.url = 'https://another.example'
    state.data.token = 'other-account'
  })
  resolve(reply({ ticket: 'old-ticket' }))
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
})
