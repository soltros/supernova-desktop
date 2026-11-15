import { request } from '@/api/httpClient'
async function pingView() {
  try {
    await request('/api/auth/me')
    return true
  } catch {
    return false
  }
}
async function pingInfo() {
  const d = await request<{ status: string; version: string }>('/api/health')
  return { ...d, type: 'Supernova', serverVersion: d.version }
}
export const ping = { pingView, pingInfo }
