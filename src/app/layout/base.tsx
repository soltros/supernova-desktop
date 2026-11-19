import { Capacitor } from '@capacitor/core'
import { memo } from 'react'
import { MainDrawerPage } from '@/app/components/drawer/page'
import { FullscreenMode } from '@/app/components/fullscreen/page'
import { Player } from '@/app/components/player/player'
import { CreatePlaylistDialog } from '@/app/components/playlist/form-dialog'
import { RemovePlaylistDialog } from '@/app/components/playlist/remove-dialog'
import { AppSidebar } from '@/app/components/sidebar/app-sidebar'
import { SongInfoDialog } from '@/app/components/song/info-dialog'
import {
  MainSidebarInset,
  MainSidebarProvider,
} from '@/app/components/ui/main-sidebar'
import { useIsMobile } from '@/app/hooks/use-mobile'
import { Header } from '@/app/layout/header'
import { MainRoutes } from './main'
import { MobileLayout } from './mobile'

const MemoHeader = memo(Header)
const MemoPlayer = memo(Player)
const MemoSongInfoDialog = memo(SongInfoDialog)
const MemoRemovePlaylistDialog = memo(RemovePlaylistDialog)
const MemoMainDrawerPage = memo(MainDrawerPage)
const MemoFullscreenMode = memo(FullscreenMode)

export default function BaseLayout() {
  const narrow = useIsMobile()
  const mobile = Capacitor.isNativePlatform() || narrow

  return (
    <div className="h-dvh w-full overflow-hidden">
      <MainSidebarProvider className={mobile ? 'pt-0 pb-0' : undefined}>
        {mobile ? (
          <MobileLayout />
        ) : (
          <>
            <MemoHeader />
            <AppSidebar />
            <MainSidebarInset>
              <MainRoutes />
            </MainSidebarInset>
            <MemoPlayer />
          </>
        )}
      </MainSidebarProvider>
      <MemoSongInfoDialog />
      <MemoRemovePlaylistDialog />
      <MemoMainDrawerPage />
      <CreatePlaylistDialog />
      {!mobile && <MemoFullscreenMode />}
    </div>
  )
}
