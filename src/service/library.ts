import type { ScanStatus } from '@/types/responses/library'
import { request } from '@/api/httpClient'
async function getScanStatus(): Promise<ScanStatus> {
  const d = await request<{ status: string; files_scanned: number }>(
    '/api/scan/progress',
  )
  return {
    scanning: d.status === 'scanning' ? 'true' : 'false',
    count: String(d.files_scanned),
  }
}
async function startScan() {
  await request('/api/scan', { method: 'POST' })
  return getScanStatus()
}
export const library = { getScanStatus, startScan }
