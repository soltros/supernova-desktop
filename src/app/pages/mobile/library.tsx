import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { libraryItems, SidebarItems } from '@/app/layout/sidebar'
import { useAppStore } from '@/store/app.store'

export default function MobileLibrary() {
  const { t } = useTranslation()
  const podcastsActive = useAppStore((state) => state.podcasts.active)
  const pages = useAppStore((state) => state.pages)
  const hidden = {
    [SidebarItems.Artists]: pages.hideArtistsSection,
    [SidebarItems.Songs]: pages.hideSongsSection,
    [SidebarItems.Albums]: pages.hideAlbumsSection,
    [SidebarItems.Genres]: pages.hideGenresSection,
    [SidebarItems.Favorites]: pages.hideFavoritesSection,
    [SidebarItems.Playlists]: pages.hidePlaylistsSection,
    [SidebarItems.Podcasts]: !podcastsActive,
    [SidebarItems.Radios]: pages.hideRadiosSection,
  }

  return (
    <section className="mobile-page">
      <h1 className="mobile-page-title">{t('sidebar.library')}</h1>
      <div className="mobile-list">
        {libraryItems
          .filter(({ id }) => !hidden[id])
          .map(({ id, title, route, icon: Icon }) => (
            <Link key={id} to={route} className="mobile-list-row">
              <span className="mobile-list-icon">
                <Icon size={19} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">{t(title)}</span>
              <ChevronRight
                size={17}
                className="text-muted-foreground"
                aria-hidden
              />
            </Link>
          ))}
      </div>
    </section>
  )
}
