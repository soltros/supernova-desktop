import { request } from '@/api/httpClient'
async function send(id: string, submission = true) {
  if (submission)
    await request('/api/scrobbles', {
      method: 'POST',
      body: JSON.stringify({ track_id: id }),
    })
}
export const scrobble = { send }
