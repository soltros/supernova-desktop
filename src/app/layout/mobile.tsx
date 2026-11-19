import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import CommandMenu from '@/app/components/command/command-menu'
import { AppTitle } from '@/app/components/header/app-title'
import { NavigationButtons } from '@/app/components/header/navigation-buttons'
import { UserDropdown } from '@/app/components/header/user-dropdown'
import { Player } from '@/app/components/player/player'
import { SettingsButton } from '@/app/components/settings/header-button'
import { Button } from '@/app/components/ui/button'
import { useAppStore } from '@/store/app.store'
import { MainRoutes } from './main'
import { libraryItems, mainNavItems, SidebarItems } from './sidebar'

const tabs = [
  ...mainNavItems,
  ...libraryItems.filter(({ id }) =>
    [
      SidebarItems.Albums,
      SidebarItems.Artists,
      SidebarItems.Playlists,
    ].includes(id),
  ),
]

export function MobileLayout() {
  const { t } = useTranslation()
  const openSearch = useAppStore((state) => state.command.setOpen)

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background [padding-top:env(safe-area-inset-top)] [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-2 py-1">
        <NavigationButtons />
        <AppTitle mobile />
        <div className="flex items-center">
          <SettingsButton />
          <UserDropdown />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <MainRoutes />
      </div>
      <Player mobile />
      <nav className="grid shrink-0 grid-cols-5 border-t [padding-bottom:env(safe-area-inset-bottom)]">
        {tabs.map(({ id, route, title, icon: Icon }) => (
          <NavLink
            key={id}
            to={route}
            end={route === '/'}
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground aria-[current=page]:text-primary"
          >
            <Icon className="size-5" />
            {t(title)}
          </NavLink>
        ))}
        <Button
          variant="ghost"
          className="h-14 flex-col gap-1 rounded-none px-0 text-xs text-muted-foreground"
          onClick={() => openSearch(true)}
        >
          <Search className="size-5" />
          {t('sidebar.search')}
        </Button>
      </nav>
      <CommandMenu hideTrigger />
    </div>
  )
}
