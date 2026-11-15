import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { supernova } from '@/service/supernova'
import { useAppStore } from '@/store/app.store'

export async function loginLoader() {
  const { url, username, token, isServerConfigured } =
    useAppStore.getState().data

  const hasUrl = Boolean(url)
  const hasPassword = Boolean(token)
  const hasUser = Boolean(username)

  if (hasUrl && hasPassword && hasUser && isServerConfigured) {
    const isServerUp = await supernova.ping.pingView()
    if (isServerUp) return redirect(ROUTES.LIBRARY.HOME)
  }

  return null
}
