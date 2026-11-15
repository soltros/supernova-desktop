import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { supernova } from '@/service/supernova'
import { useAppStore } from '@/store/app.store'

export async function protectedLoader() {
  const { url, token, isServerConfigured } = useAppStore.getState().data
  const hasNoUrl = !url || url === ''
  const hasNoToken = !token || token === ''

  if (hasNoUrl || hasNoToken || !isServerConfigured)
    return redirect(ROUTES.SERVER_CONFIG)

  const isServerUp = await supernova.ping.pingView()
  if (!isServerUp) return redirect(ROUTES.SERVER_CONFIG)

  return null
}

export async function podcastsLoader() {
  const { active } = useAppStore.getState().podcasts

  if (!active) {
    return redirect(ROUTES.LIBRARY.HOME)
  }

  return null
}
