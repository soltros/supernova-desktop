import { pluginQuery } from '@/app/hooks/use-server-plugins'
import { queryClient } from '@/lib/queryClient'
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

async function requirePlugin(id: string) {
  const { url, username, token } = useAppStore.getState().data
  if (!url || !token) return redirect(ROUTES.SERVER_CONFIG)
  const plugins = await queryClient.fetchQuery(pluginQuery(url, username))
  return plugins.some((plugin) => plugin.id === id && plugin.enabled)
    ? null
    : redirect(ROUTES.LIBRARY.HOME)
}

export const podcastsLoader = () => requirePlugin('podcasts')
export const radiosLoader = () => requirePlugin('radiobrowser')
