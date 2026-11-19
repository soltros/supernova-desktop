import { ChevronLeft, House, Library, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { UserDropdown } from '@/app/components/header/user-dropdown'
import { Player } from '@/app/components/player/player'
import { SettingsButton } from '@/app/components/settings/header-button'
import { ROUTES } from '@/routes/routesList'
import { MainRoutes } from './main'

const tabs = [
  { to: ROUTES.LIBRARY.HOME, label: 'sidebar.home', Icon: House },
  { to: ROUTES.LIBRARY.ROOT, label: 'sidebar.library', Icon: Library },
  { to: ROUTES.SEARCH, label: 'sidebar.search', Icon: Search },
]

export function MobileLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const section = tabs.find(({ to }) => to === pathname)
  const parent =
    pathname.split('/').length > 3
      ? pathname.slice(0, pathname.lastIndexOf('/'))
      : ROUTES.LIBRARY.ROOT

  return (
    <div className="mobile-shell">
      <header className="mobile-toolbar">
        {!section && (
          <Link
            to={parent}
            className="mobile-back"
            onClick={(event) => {
              if (window.history.state?.idx > 0) {
                event.preventDefault()
                navigate(-1)
              }
            }}
          >
            <ChevronLeft size={22} aria-hidden />
            <span>{t('generic.back', { defaultValue: 'Back' })}</span>
          </Link>
        )}
        <div className="mobile-toolbar-actions">
          <SettingsButton />
          <UserDropdown mobile />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <MainRoutes />
      </div>
      <Player mobile />
      <nav className="mobile-tabs" aria-label={t('sidebar.library')}>
        {tabs.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="mobile-tab">
            <span className="mobile-tab-icon">
              <Icon size={21} aria-hidden />
            </span>
            {t(label)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
