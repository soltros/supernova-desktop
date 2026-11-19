import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { songModel } from '@/api/models'
import { usePlayerStore } from '@/store/player.store'
import { Player } from '@/app/components/player/player'

const { getSongStreamUrl } = vi.hoisted(() => ({
  getSongStreamUrl: vi.fn((id: string) =>
    Promise.resolve(`https://music.example/stream/${id}`),
  ),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
  CapacitorHttp: {},
}))
vi.mock('@/api/httpClient', async (original) => ({
  ...(await original<typeof import('@/api/httpClient')>()),
  getSongStreamUrl,
}))
vi.mock('@/app/components/player/mobile-player', () => ({
  MobilePlayer: () => null,
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps its audio element and starts the prepared track when a song ends', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('React', await import('react'))
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  const container = document.createElement('div')
  const root = createRoot(container)
  const actions = usePlayerStore.getState().actions
  const songs = ['first', 'second'].map((id) =>
    songModel({
      id,
      title: id,
      album_id: 'album',
      artist_name: 'Artist',
      duration_ms: 180_000,
      track_number: 1,
      disc_number: 1,
      bitrate: 320,
      format: 'mp3',
    }),
  )

  try {
    await act(async () => {
      actions.setSongList(songs, 0)
      root.render(createElement(Player, { mobile: true }))
    })
    const audio = container.querySelector('audio')
    expect(audio?.getAttribute('src')).toBe(
      'https://music.example/stream/first',
    )

    await act(async () => {
      actions.setCurrentDuration(180)
      actions.setProgress(159)
    })
    expect(getSongStreamUrl).toHaveBeenCalledWith(
      'second',
      undefined,
      undefined,
    )
    play.mockClear()
    await act(async () => audio?.dispatchEvent(new Event('ended')))

    expect(container.querySelector('audio')).toBe(audio)
    expect(audio?.getAttribute('src')).toBe(
      'https://music.example/stream/second',
    )
    expect(usePlayerStore.getState().playerState.isPlaying).toBe(true)
    expect(play).toHaveBeenCalled()
    expect(
      getSongStreamUrl.mock.calls.filter(([id]) => id === 'second'),
    ).toHaveLength(1)
  } finally {
    await act(async () => root.unmount())
    actions.clearPlayerState()
  }
})
