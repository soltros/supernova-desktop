import { HomeHeader } from '@/app/components/home/carousel/header'
import { Explore } from '@/app/components/home/explore'
import { RecentlyAdded } from '@/app/components/home/recently-added'
import { RecentlyPlayed } from '@/app/components/home/recently-played'

export default function Home() {
  return (
    <div className="w-full">
      <HomeHeader />

      <div className="px-8 pb-6">
        <RecentlyPlayed />
        <RecentlyAdded />
        <Explore />
      </div>
    </div>
  )
}
