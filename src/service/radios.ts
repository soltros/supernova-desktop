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
export const radios = { getAll, create, remove, update, search, subscribe }

interface BrowserStation {
  stationuuid: string
  name: string
  url_resolved: string
  url: string
  country: string
  homepage: string
}

async function search(q: string, country: string, offset: number) {
  const stations = await request<BrowserStation[] | null>(
    '/api/plugins/radio/search',
    {
      query: { q, country, offset, limit: 20 },
    },
  )
  return (stations ?? []).flatMap((station) => {
    const streamUrl = station.url_resolved || station.url
    if (!station.stationuuid || !/^https?:\/\//i.test(streamUrl)) return []
    return [
      {
        id: station.stationuuid,
        name: station.name,
        streamUrl,
        homePageUrl: /^https?:\/\//i.test(station.homepage)
          ? station.homepage
          : '',
        country: station.country,
      },
    ]
  })
}

function subscribe(station: Radio) {
  return request('/api/plugins/radio/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      station_id: station.id,
      url: station.streamUrl,
      name: station.name,
    }),
  })
}
