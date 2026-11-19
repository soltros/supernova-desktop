import { queryOptions, useQuery } from '@tanstack/react-query'
import { getPlugins } from '@/service/plugins'
import { useAppStore } from '@/store/app.store'

export function pluginQuery(url: string, username: string) {
  return queryOptions({
    queryKey: ['server-plugins', url, username],
    queryFn: getPlugins,
    staleTime: 60_000,
  })
}

export function useServerPlugins() {
  const { url, username, token } = useAppStore((state) => state.data)
  return useQuery({
    ...pluginQuery(url, username),
    enabled: Boolean(url && token),
  })
}

export function usePluginEnabled(id: string) {
  const { data } = useServerPlugins()
  return data?.some((plugin) => plugin.id === id && plugin.enabled) ?? false
}
