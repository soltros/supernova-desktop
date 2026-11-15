import { OptionsButtons } from '@/app/components/options/buttons'
import { DropdownMenuSeparator } from '@/app/components/ui/dropdown-menu'
import { useOptions } from '@/app/hooks/use-options'
import { supernova } from '@/service/supernova'
import { useIsPlaylistPlaying, usePlayerActions } from '@/store/player.store'
import { useRemovePlaylist } from '@/store/playlists.store'
import { PlaybackSource } from '@/types/playerContext'
import { Playlist, PlaylistWithEntries } from '@/types/responses/playlist'
import { ISong } from '@/types/responses/song'

type GetSongsToQueueCallback = (songs: ISong[], source?: PlaybackSource) => void

interface PlaylistOptionsProps {
  playlist: PlaylistWithEntries | Playlist
  variant?: 'context' | 'dropdown'
  showPlay?: boolean
  disablePlayNext?: boolean
  disableAddLast?: boolean
  disableDownload?: boolean
  disableEdit?: boolean
  disableDelete?: boolean
}

export function PlaylistOptions({
  playlist,
  variant = 'dropdown',
  showPlay = false,
  disablePlayNext = false,
  disableAddLast = false,
  disableDownload: _disableDownload = true,
  disableEdit: _disableEdit = true,
  disableDelete = false,
}: PlaylistOptionsProps) {
  const { play, playNext, playLast } = useOptions()
  const { setPlaylistId, setConfirmDialogState } = useRemovePlaylist()
  const { isPlaylistActive, isPlaylistPlaying } = useIsPlaylistPlaying(
    playlist.id,
  )
  const { togglePlayPause } = usePlayerActions()

  async function getSongsToQueue(
    callback: GetSongsToQueueCallback,
    source?: PlaybackSource,
  ) {
    const playlistWithEntries = await supernova.playlists.getOne(playlist.id)
    if (!playlistWithEntries) return

    callback(playlistWithEntries.entry, source)
  }

  const playbackSource: PlaybackSource = {
    id: playlist.id,
    name: playlist.name,
    type: 'playlist',
  }

  async function handlePlay() {
    if (isPlaylistActive) {
      if (!isPlaylistPlaying) togglePlayPause()
      return
    }

    if ('entry' in playlist) {
      play(playlist.entry, playbackSource)
    } else {
      await getSongsToQueue(play, playbackSource)
    }
  }

  async function handlePlayNext() {
    if ('entry' in playlist) {
      playNext(playlist.entry)
    } else {
      await getSongsToQueue(playNext)
    }
  }

  async function handlePlayLast() {
    if ('entry' in playlist) {
      playLast(playlist.entry)
    } else {
      await getSongsToQueue(playLast)
    }
  }

  return (
    <>
      {variant === 'context' && (
        <>
          <div className="px-2 py-0.5 max-w-64">
            <span className="text-xs text-muted-foreground break-words line-clamp-4">
              {playlist.name}
            </span>
          </div>
          <DropdownMenuSeparator />
        </>
      )}
      {showPlay && (
        <OptionsButtons.Play
          variant={variant}
          onClick={(e) => {
            e.stopPropagation()
            handlePlay()
          }}
        />
      )}
      <OptionsButtons.PlayNext
        variant={variant}
        disabled={disablePlayNext}
        onClick={(e) => {
          e.stopPropagation()
          handlePlayNext()
        }}
      />
      <OptionsButtons.PlayLast
        variant={variant}
        disabled={disableAddLast}
        onClick={(e) => {
          e.stopPropagation()
          handlePlayLast()
        }}
      />
      <DropdownMenuSeparator />
      <OptionsButtons.RemovePlaylist
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          setPlaylistId(playlist.id)
          setConfirmDialogState(true)
        }}
        disabled={disableDelete}
      />
    </>
  )
}
