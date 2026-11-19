import { Pause, Play, SkipForward } from 'lucide-react'
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
      <div className="flex min-h-14 items-center gap-1 border-t bg-background-foreground px-2">
        <Button
          variant="ghost"
          className="h-12 min-w-0 flex-1 justify-start gap-2 px-1 text-left"
          aria-label={`Now Playing — ${title}`}
          onClick={() => setIsFullscreen(true)}
        >
          <ImageLoader id={song?.coverArt} type="song" size={80}>
            {(src) => (
              <img
                src={src}
                alt=""
                className="size-9 shrink-0 rounded object-cover"
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
          className="flex h-dvh max-w-none flex-col justify-center overflow-y-auto px-4 [padding-top:calc(3rem+env(safe-area-inset-top))] [padding-bottom:calc(3rem+env(safe-area-inset-bottom))] [&>button:last-child]:[top:calc(1rem+env(safe-area-inset-top))]"
        >
          <DialogTitle className="sr-only">Now Playing</DialogTitle>
          <ImageLoader id={song?.coverArt} type="song" size={500}>
            {(src) => (
              <img
                src={src}
                alt=""
                className="mx-auto aspect-square w-full max-w-72 rounded-lg object-cover"
              />
            )}
          </ImageLoader>
          <div className="text-center">
            <div className="text-xl font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{artist}</div>
          </div>
          {!isRadio && <FullscreenProgress />}
          <div className="flex justify-center">
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
        </DialogContent>
      </Dialog>
    </>
  )
}
