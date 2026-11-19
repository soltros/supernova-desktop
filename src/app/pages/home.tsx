import { Discovery } from '@/app/components/home/discovery'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/app/hooks/use-mobile'
import { HomeHeader } from '@/app/components/home/carousel/header'
import { Explore } from '@/app/components/home/explore'
import { RecentlyAdded } from '@/app/components/home/recently-added'
import { RecentlyPlayed } from '@/app/components/home/recently-played'

export default function Home() {
  const { t } = useTranslation()
  const narrow = useIsMobile()
  if (narrow || Capacitor.isNativePlatform()) {
    return (
      <section className="mobile-page">
        <h1 className="mobile-page-title">{t('sidebar.home')}</h1>
        <RecentlyPlayed />
        <RecentlyAdded />
        <Explore />
        <Discovery />
      </section>
    )
  }

  return (
    <div className="w-full">
      <HomeHeader />

      <div className="px-8 pb-6">
        <RecentlyPlayed />
        <RecentlyAdded />
        <Explore />
        <Discovery />
      </div>
    </div>
  )
}
