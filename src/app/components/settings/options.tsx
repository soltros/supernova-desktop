import {
  CircleUserRound,
  EarthLock,
  FileText,
  Globe,
  Headphones,
  LaptopIcon,
  Paintbrush,
  Server,
} from 'lucide-react'
import { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/app/components/ui/sidebar'
import { useAppSettings } from '@/store/app.store'
import { isDesktop } from '@/utils/desktop'

export type SettingsOptions =
  | 'appearance'
  | 'language'
  | 'audio'
  | 'content'
  | 'accounts'
  | 'desktop'
  | 'privacy'
  | 'server'

interface OptionsData {
  id: SettingsOptions
  icon: ComponentType
}

const accountsOption: OptionsData = { id: 'accounts', icon: CircleUserRound }
const desktopOption: OptionsData = { id: 'desktop', icon: LaptopIcon }

const options: OptionsData[] = [
  { id: 'appearance', icon: Paintbrush },
  { id: 'language', icon: Globe },
  { id: 'audio', icon: Headphones },
  { id: 'content', icon: FileText },
  ...(isDesktop() ? [accountsOption, desktopOption] : []),
  { id: 'server', icon: Server },
  { id: 'privacy', icon: EarthLock },
]

export function SettingsSectionPicker() {
  const { t } = useTranslation()
  const { currentPage, setCurrentPage } = useAppSettings()

  return (
    <select
      className="mx-4 mb-3 min-h-11 rounded-xl border bg-background px-3 text-base md:hidden"
      aria-label={t('settings.label')}
      value={currentPage}
      onChange={(event) => {
        const option = options.find(({ id }) => id === event.target.value)
        if (option) setCurrentPage(option.id)
      }}
    >
      {options.map(({ id }) => (
        <option key={id} value={id}>
          {t(`settings.options.${id}`, { defaultValue: 'Server' })}
        </option>
      ))}
    </select>
  )
}

export function SettingsOptions() {
  const { t } = useTranslation()
  const { currentPage, setCurrentPage } = useAppSettings()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {options.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={item.id === currentPage}
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon />
                <span>
                  {t(`settings.options.${item.id}`, { defaultValue: 'Server' })}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
