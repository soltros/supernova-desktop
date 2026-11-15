import { request } from '@/api/httpClient'
import { unsupported } from '@/api/models'
import type { Radio, CreateRadio } from '@/types/responses/radios'
interface Subscription {
  id: string
  station_id: string
  url: string
  name: string
}
async function getAll(): Promise<Radio[]> {
  return (
    (await request<Subscription[] | null>(
      '/api/plugins/radio/subscriptions',
    )) || []
  ).map((s) => ({
    id: s.station_id,
    name: s.name,
    streamUrl: s.url,
    homePageUrl: '',
  }))
}
async function create(d: CreateRadio) {
  await request('/api/plugins/radio/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      station_id: d.streamUrl,
      url: d.streamUrl,
      name: d.name,
    }),
  })
}
async function remove(id: string) {
  await request('/api/plugins/radio/subscriptions', {
    method: 'DELETE',
    query: { station_id: id },
  })
}
async function update(_d: Radio) {
  return unsupported('Editing radio subscriptions')
}
export const radios = { getAll, create, remove, update }
