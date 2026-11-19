import { ChevronDown, Pause, Play, SkipForward } from 'lucide-react'
import { FullscreenProgress } from '@/app/components/fullscreen/progress'
import { ImageLoader } from '@/app/components/image-loader'
import { MiniPlayerControls } from '@/app/components/mini-player/controls'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog'
import {
  usePlayerActions,
  usePlayerFullscreen,
  usePlayerIsPlaying,
  usePlayerMediaType,
  usePlayerPrevAndNext,
  usePlayerSonglist,
} from '@/store/player.store'

export function MobilePlayer() {
  const { currentList, currentSongIndex, radioList, podcastList } =
    usePlayerSonglist()
  const { isSong, isRadio } = usePlayerMediaType()
  const { isFullscreen, setIsFullscreen } = usePlayerFullscreen()
  const { hasNext } = usePlayerPrevAndNext()
  const isPlaying = usePlayerIsPlaying()
  const { togglePlayPause, playNextSong } = usePlayerActions()

  const song = isSong ? currentList[currentSongIndex] : undefined
  const radio = isRadio ? radioList[currentSongIndex] : undefined
  const episode =
    !isSong && !isRadio ? podcastList[currentSongIndex] : undefined
  const title = song?.title || radio?.name || episode?.title

  if (!title) return null

  const artist = song?.artist || episode?.podcast.title || radio?.name
  const playLabel = isPlaying ? 'Pause' : 'Play'
  const PlayIcon = isPlaying ? Pause : Play

  return (
    <>
      <div className="mobile-mini-player">
        <Button
          variant="ghost"
          className="h-12 min-w-0 flex-1 justify-start gap-2 px-1 text-left"
          aria-label={`Now Playing — ${title}`}
          onClick={() => setIsFullscreen(true)}
        >
          <ImageLoader id={song?.coverArt} type="song" size={80}>
            {(src) => (
              <img
                src={src || undefined}
                alt=""
                className="size-10 shrink-0 rounded-lg bg-muted object-cover"
              />
            )}
          </ImageLoader>
          <span className="min-w-0">
            <span className="block truncate">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {artist}
            </span>
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={playLabel}
          onClick={togglePlayPause}
        >
          <PlayIcon className="size-5" />
        </Button>
        {!isRadio && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Next track"
            disabled={!hasNext}
            onClick={playNextSong}
          >
            <SkipForward className="size-5" />
          </Button>
        )}
      </div>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          aria-describedby={undefined}
          className="mobile-now-playing flex h-dvh max-w-none flex-col gap-0 overflow-y-auto rounded-none border-0"
        >
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full bg-foreground/10"
              aria-label="Close Now Playing"
              onClick={() => setIsFullscreen(false)}
            >
              <ChevronDown size={22} />
            </Button>
            <DialogTitle className="text-xs font-semibold tracking-wide text-muted-foreground">
              Now Playing
            </DialogTitle>
            <span className="size-11" aria-hidden />
          </div>
          <div className="mx-auto my-auto flex w-full max-w-[370px] flex-col gap-5 py-2">
            <ImageLoader id={song?.coverArt} type="song" size={500}>
              {(src) => (
                <img
                  src={src || undefined}
                  alt=""
                  className="mobile-now-playing-art mx-auto aspect-square bg-muted object-cover"
                />
              )}
            </ImageLoader>
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-tight tracking-tight">
                {title}
              </div>
              <div className="text-sm text-muted-foreground">{artist}</div>
            </div>
            {!isRadio && <FullscreenProgress />}
            <div className="mobile-now-playing-controls flex justify-center">
              {song ? (
                <MiniPlayerControls />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={playLabel}
                  onClick={togglePlayPause}
                >
                  <PlayIcon className="size-5" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
