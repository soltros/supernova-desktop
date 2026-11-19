import { request } from '@/api/httpClient'

export interface ServerPlugin {
  id: string
  name: string
  description: string
  enabled: boolean
}

export type PreviewPlugin = 'albummerger' | 'artistmerger' | 'deduper'

export function getPlugins() {
  return request<ServerPlugin[]>('/api/plugins')
}

export function previewPlugin(id: PreviewPlugin) {
  return request<{ candidates: unknown[] | null; warning?: string }>(
    `/api/plugins/${id}/preview`,
  )
}

export function runAutoTagger() {
  return request('/api/plugins/autotagger/run', { method: 'POST' })
}
