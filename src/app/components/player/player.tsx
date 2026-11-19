import { Capacitor } from '@capacitor/core'
import { flushSync } from 'react-dom'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSongStreamUrl } from '@/api/httpClient'
import { getProxyURL } from '@/api/podcastClient'
import { MiniPlayerButton } from '@/app/components/mini-player/button'
import { RadioInfo } from '@/app/components/player/radio-info'
import { TrackInfo } from '@/app/components/player/track-info'
import { podcasts } from '@/service/podcasts'
import { useAppStore } from '@/store/app.store'
import {
  getVolume,
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerLoop,
  usePlayerMediaType,
  usePlayerSonglist,
  usePlayerStore,
  useReplayGainState,
} from '@/store/player.store'
import { LoopState } from '@/types/playerContext'
import { ensureSupportForAlac } from '@/utils/alac'
import { hasPiPSupport } from '@/utils/browser'
import { logger } from '@/utils/logger'
import { ReplayGainParams } from '@/utils/replayGain'
import { manageMediaSession } from '@/utils/setMediaSession'
import { AudioPlayer } from './audio'
import { PlayerClearQueueButton } from './clear-queue-button'
import { PlayerControls } from './controls'
import { PlayerExpandButton } from './expand-button'
import { PlayerLikeButton } from './like-button'
import { PlayerLyricsButton } from './lyrics-button'
import { MobilePlayer } from './mobile-player'
import { PodcastInfo } from './podcast-info'
import { PodcastPlaybackRate } from './podcast-playback-rate'
import { PlayerProgress } from './progress'
import { PlayerQueueButton } from './queue-button'
import { PlayerVolume } from './volume'

const MemoTrackInfo = memo(TrackInfo)
const MemoRadioInfo = memo(RadioInfo)
const MemoPodcastInfo = memo(PodcastInfo)
const MemoPlayerControls = memo(PlayerControls)
const MemoPlayerProgress = memo(PlayerProgress)
const MemoPlayerLikeButton = memo(PlayerLikeButton)
const MemoPlayerQueueButton = memo(PlayerQueueButton)
const MemoPlayerClearQueueButton = memo(PlayerClearQueueButton)
const MemoPlayerVolume = memo(PlayerVolume)
const MemoPlayerExpandButton = memo(PlayerExpandButton)
const MemoPodcastPlaybackRate = memo(PodcastPlaybackRate)
const MemoLyricsButton = memo(PlayerLyricsButton)
const MemoMiniPlayerButton = memo(MiniPlayerButton)

export function Player({ mobile = false }: { mobile?: boolean }) {
  const hideFavoritesSection = useAppStore().pages.hideFavoritesSection
  const audioRef = useRef<HTMLAudioElement>(null)
  const radioRef = useRef<HTMLAudioElement>(null)
  const podcastRef = useRef<HTMLAudioElement>(null)
  const {
    setAudioPlayerRef,
    setCurrentDuration,
    setProgress,
    setPlayingState,
    handleSongEnded,
    getCurrentProgress,
    getCurrentPodcastProgress,
    setUpdatePodcastProgress,
  } = usePlayerActions()
  const { currentList, currentSongIndex, radioList, podcastList } =
    usePlayerSonglist()
  const isPlaying = usePlayerIsPlaying()
  const { isSong, isRadio, isPodcast } = usePlayerMediaType()
  const loopState = usePlayerLoop()
  const currentPlaybackRate = usePlayerStore().playerState.currentPlaybackRate
  const { replayGainType, replayGainPreAmp, replayGainDefaultGain } =
    useReplayGainState()

  const song = currentList[currentSongIndex]
  const radio = radioList[currentSongIndex]
  const podcast = podcastList[currentSongIndex]

  const songId = song?.id
  const nativeMusic = Capacitor.isNativePlatform() && isSong && Boolean(songId)
  const token = useAppStore((state) => state.data.token)
  const nextSong =
    currentList[currentSongIndex + 1] ??
    (loopState === LoopState.All ? currentList[0] : undefined)
  const prepared = useRef<{
    id: string
    url: string
    token: string
    expires: number
  }>()

  const [songStream, setSongStream] = useState<{ id: string; url: string }>()
  const songStreamUrl = songStream?.id === songId ? songStream?.url : undefined
  useEffect(() => {
    let active = true
    const next = prepared.current
    if (
      nativeMusic &&
      next?.id === songId &&
      next.token === token &&
      next.expires > Date.now()
    ) {
      setSongStream({ id: next.id, url: next.url })
      prepared.current = undefined
      return
    }
    setSongStream(undefined)
    if (songId && isSong)
      getSongStreamUrl(songId, undefined, ensureSupportForAlac(song.suffix))
        .then((url) => {
          if (active) setSongStream({ id: songId, url })
        })
        .catch(() => {
          if (active) setPlayingState(false)
        })
    return () => {
      active = false
    }
  }, [isSong, nativeMusic, songId, song?.suffix, setPlayingState, token])

  useEffect(() => {
    if (
      !nativeMusic ||
      !nextSong ||
      nextSong.id === songId ||
      loopState === LoopState.One
    )
      return
    let active = true
    let retryAfter = 0
    const stop = usePlayerStore.subscribe(
      (state) => state.playerProgress.progress,
      (progress) => {
        const current = usePlayerStore.getState()
        const remaining = current.playerState.currentDuration - progress
        if (
          !current.playerState.isPlaying ||
          remaining <= 0 ||
          remaining > 25 ||
          Date.now() < retryAfter
        )
          return
        const cached = prepared.current
        if (
          cached?.id === nextSong.id &&
          cached.token === token &&
          cached.expires > Date.now()
        )
          return
        retryAfter = Date.now() + 10_000
        getSongStreamUrl(
          nextSong.id,
          undefined,
          ensureSupportForAlac(nextSong.suffix),
        )
          .then((url) => {
            if (active)
              prepared.current = {
                id: nextSong.id,
                token,
                url,
                expires: Date.now() + 75_000,
              }
          })
          .catch((error) =>
            logger.info('Could not prepare the next track', error),
          )
      },
    )
    return () => {
      active = false
      stop()
    }
  }, [loopState, nativeMusic, nextSong, songId, token])

  const getAudioRef = useCallback(() => {
    if (isRadio) return radioRef
    if (isPodcast) return podcastRef

    return audioRef
  }, [isPodcast, isRadio])

  useEffect(() => {
    if (!mobile) return
    if (isPodcast) {
      manageMediaSession.setPodcastHandlers({
        handleSeekAction: (seconds) => {
          const audio = podcastRef.current
          if (audio) audio.currentTime += seconds
        },
      })
    } else {
      manageMediaSession.setHandlers()
    }
  }, [isPodcast, mobile])

  useEffect(() => {
    if (!nativeMusic) return
    const node = audioRef.current
    setAudioPlayerRef(node)
    return () => {
      if (usePlayerStore.getState().playerState.audioPlayerRef === node)
        setAudioPlayerRef(null)
    }
  }, [nativeMusic, setAudioPlayerRef])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Desktop and other media remount on source changes.
  useEffect(() => {
    if (nativeMusic) return
    const node = getAudioRef().current
    setAudioPlayerRef(node)
    return () => {
      if (usePlayerStore.getState().playerState.audioPlayerRef === node)
        setAudioPlayerRef(null)
      if (node) {
        node.pause()
        node.removeAttribute('src')
        node.load()
      }
    }
  }, [
    getAudioRef,
    nativeMusic,
    songStreamUrl,
    songId,
    radio?.id,
    podcast?.id,
    setAudioPlayerRef,
  ])

  useEffect(() => {
    const audio = podcastRef.current
    if (!audio || !isPodcast) return

    audio.playbackRate = currentPlaybackRate
  }, [currentPlaybackRate, isPodcast])

  const setupDuration = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const audioDuration = Math.floor(audio.duration)
    const infinityDuration = audioDuration === Infinity

    if (!infinityDuration) {
      setCurrentDuration(audioDuration)
    } else if (isSong && song?.duration) {
      setCurrentDuration(song.duration)
    }

    if (isPodcast && infinityDuration && podcast) {
      setCurrentDuration(podcast.duration)
    }

    if (isPodcast) {
      const podcastProgress = getCurrentPodcastProgress()

      logger.info('[Player] - Resuming episode from:', {
        seconds: podcastProgress,
      })

      setProgress(podcastProgress)
      audio.currentTime = podcastProgress
    } else {
      const progress = getCurrentProgress()
      audio.currentTime = progress
    }
  }, [
    getAudioRef,
    isPodcast,
    isSong,
    song,
    podcast,
    setCurrentDuration,
    getCurrentPodcastProgress,
    setProgress,
    getCurrentProgress,
  ])

  const setupProgress = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const currentProgress = Math.floor(audio.currentTime)
    setProgress(currentProgress)
    if (
      isPodcast &&
      podcast &&
      currentProgress > 0 &&
      Math.abs(currentProgress - getCurrentPodcastProgress()) >= 30
    ) {
      setUpdatePodcastProgress(currentProgress)
      podcasts
        .saveEpisodeProgress(podcast.id, currentProgress)
        .catch((error) => logger.error('Error sending podcast progress', error))
    }
  }, [
    getAudioRef,
    getCurrentPodcastProgress,
    isPodcast,
    podcast,
    setProgress,
    setUpdatePodcastProgress,
  ])

  const setupInitialVolume = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    audio.volume = getVolume() / 100
  }, [getAudioRef])

  const sendFinishProgress = useCallback(() => {
    if (!isPodcast || !podcast) return

    podcasts
      .saveEpisodeProgress(podcast.id, podcast.duration, true)
      .then(() => {
        logger.info('Complete progress sent:', podcast.duration)
      })
      .catch((error) => {
        logger.error('Error sending complete progress', error)
      })
  }, [isPodcast, podcast])

  const trackReplayGain = useMemo<ReplayGainParams>(() => {
    const preAmp = replayGainPreAmp
    const defaultGain = replayGainDefaultGain

    if (!song || !song.replayGain) {
      return { gain: defaultGain, peak: 1, preAmp }
    }

    if (replayGainType === 'album') {
      let { albumGain = defaultGain, albumPeak = 1 } = song.replayGain

      if (albumGain === 0) {
        albumGain = defaultGain
      }

      return { gain: albumGain, peak: albumPeak, preAmp }
    }

    let { trackGain = defaultGain, trackPeak = 1 } = song.replayGain

    if (trackGain === 0) {
      trackGain = defaultGain
    }
    return { gain: trackGain, peak: trackPeak, preAmp }
  }, [song, replayGainDefaultGain, replayGainPreAmp, replayGainType])

  return (
    <footer
      className={
        mobile
          ? 'shrink-0'
          : 'border-t h-[--player-height] w-full flex items-center fixed bottom-0 left-0 right-0 z-40 bg-background'
      }
    >
      {mobile ? (
        <MobilePlayer />
      ) : (
        <div className="w-full h-full grid grid-cols-player gap-2 px-4">
          {/* Track Info */}
          <div className="flex items-center gap-2 w-full">
            {isSong && <MemoTrackInfo song={song} />}
            {isRadio && <MemoRadioInfo radio={radio} />}
            {isPodcast && <MemoPodcastInfo podcast={podcast} />}
          </div>
          {/* Main Controls */}
          <div className="col-span-2 flex flex-col justify-center items-center px-4 gap-1">
            <MemoPlayerControls
              song={song}
              radio={radio}
              podcast={podcast}
              audioRef={getAudioRef()}
            />

            {(isSong || isPodcast) && (
              <MemoPlayerProgress audioRef={getAudioRef()} />
            )}
          </div>
          {/* Remain Controls and Volume */}
          <div className="flex items-center w-full justify-end">
            <div className="flex items-center gap-1">
              {isSong && !hideFavoritesSection && (
                <>
                  <MemoPlayerLikeButton disabled={!song} />
                </>
              )}
              {isSong && (
                <>
                  <MemoLyricsButton disabled={!song} />
                  <MemoPlayerQueueButton disabled={!song} />
                </>
              )}
              {isPodcast && <MemoPodcastPlaybackRate />}
              {(isRadio || isPodcast) && (
                <MemoPlayerClearQueueButton disabled={!radio && !podcast} />
              )}

              <MemoPlayerVolume
                audioRef={getAudioRef()}
                disabled={!song && !radio && !podcast}
              />

              {isSong && <MemoPlayerExpandButton disabled={!song} />}
              {isSong && hasPiPSupport && <MemoMiniPlayerButton />}
            </div>
          </div>
        </div>
      )}

      {isSong && song && (nativeMusic || songStreamUrl) && (
        <AudioPlayer
          key={nativeMusic ? 'native-music' : songStreamUrl}
          replayGain={trackReplayGain}
          src={songStreamUrl}
          autoPlay={isPlaying}
          audioRef={audioRef}
          loop={loopState === LoopState.One}
          onPlay={() => setPlayingState(true)}
          onPause={(event) => {
            const audio = event.currentTarget
            if (
              audio.ended ||
              (nativeMusic && audio.currentSrc !== songStreamUrl)
            )
              return
            setPlayingState(false)
          }}
          onLoadedMetadata={setupDuration}
          onTimeUpdate={setupProgress}
          onEnded={(event) => {
            const next = prepared.current
            if (
              !nativeMusic ||
              !next ||
              next.token !== token ||
              next.expires <= Date.now()
            ) {
              handleSongEnded()
              return
            }
            const audio = event.currentTarget
            // Commit the prepared source before WebKit can suspend the finished media element.
            flushSync(() => {
              handleSongEnded()
              const { currentList, currentSongIndex } =
                usePlayerStore.getState().songlist
              if (currentList[currentSongIndex]?.id === next.id)
                setSongStream({ id: next.id, url: next.url })
            })
            if (audio.getAttribute('src') === next.url) {
              audio.play().catch(() => {
                // AudioPlayer owns error reporting and playback state.
              })
            }
          }}
          onLoadStart={setupInitialVolume}
          data-testid="player-song-audio"
        />
      )}

      {isRadio && radio && (
        <AudioPlayer
          key={radio.id}
          src={radio.streamUrl}
          autoPlay={isPlaying}
          audioRef={radioRef}
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadStart={setupInitialVolume}
          data-testid="player-radio-audio"
        />
      )}

      {isPodcast && podcast && (
        <AudioPlayer
          key={podcast.id}
          src={getProxyURL(podcast.audio_url)}
          autoPlay={isPlaying}
          audioRef={podcastRef}
          preload="auto"
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadedMetadata={setupDuration}
          onTimeUpdate={setupProgress}
          onEnded={() => {
            sendFinishProgress()
            handleSongEnded()
          }}
          onLoadStart={setupInitialVolume}
          data-testid="player-podcast-audio"
        />
      )}
    </footer>
  )
}
