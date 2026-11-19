import { request } from '@/api/httpClient'

export const backups = {
  favorites: { path: '/api/hearts', filename: 'supernova_hearts_backup.json' },
  playlists: {
    path: '/api/playlists',
    filename: 'supernova_playlists_backup.json',
  },
  podcasts: {
    path: '/api/plugins/podcasts/opml',
    filename: 'supernova_podcasts.opml',
  },
} as const

export type BackupKind = keyof typeof backups

export function exportBackup(kind: BackupKind) {
  return request<string>(`${backups[kind].path}/export`, {
    responseFormat: 'text',
  })
}

export async function importBackup(kind: BackupKind, file: File) {
  if (file.size > 9 * 1024 * 1024) throw new Error('Backup exceeds 9 MiB.')
  const content = await file.text()
  if (kind !== 'podcasts') {
    JSON.parse(content)
    return request(`${backups[kind].path}/import`, {
      method: 'POST',
      body: content,
      responseFormat: 'text',
    })
  }

  const salt = crypto.getRandomValues(new Uint32Array(4))
  const boundary = `supernova-${Array.from(salt, (part) => part.toString(16)).join('-')}`
  return request(`${backups[kind].path}/import`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="podcasts.opml"',
      'Content-Type: text/xml; charset=utf-8',
      '',
      content,
      `--${boundary}--`,
      '',
    ].join('\r\n'),
    responseFormat: 'text',
  })
}
