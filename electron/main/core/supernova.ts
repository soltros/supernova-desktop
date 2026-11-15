import { BrowserWindow, ipcMain, net, protocol } from 'electron'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'supernova-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
])
export interface NativeApiRequest {
  url: string
  method: string
  token?: string
  body?: string
}
export function validServerTarget(value: string, media = false): URL {
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error('Invalid Supernova server URL')
  if (media) {
    if (
      !/\/api\/stream\/[^/]+$/.test(url.pathname) ||
      !url.searchParams.get('ticket')
    )
      throw new Error('Only ticketed Supernova streams are allowed')
  } else if (!url.pathname.includes('/api/'))
    throw new Error('Only native API routes are allowed')
  return url
}
export function installMediaProtocol() {
  protocol.handle('supernova-media', async (request) => {
    const target = validServerTarget(
      new URL(request.url).searchParams.get('target') || '',
      true,
    )
    const headers = new Headers()
    const range = request.headers.get('Range')
    if (range) headers.set('Range', range)
    const result = await net.fetch(target.toString(), {
      method: request.method,
      headers,
      credentials: 'omit',
      redirect: 'error',
    })
    const replyHeaders = new Headers(result.headers)
    replyHeaders.set('Access-Control-Allow-Origin', '*')
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: replyHeaders,
    })
  })
}
export function installApiBridge(window: BrowserWindow) {
  ipcMain.removeHandler('supernova:request')
  ipcMain.handle(
    'supernova:request',
    async (event, payload: NativeApiRequest) => {
      if (
        event.sender !== window.webContents ||
        event.senderFrame !== window.webContents.mainFrame
      )
        throw new Error('Untrusted renderer')
      const target = validServerTarget(payload.url)
      if (
        !['GET', 'POST', 'DELETE', 'PUT'].includes(payload.method) ||
        (payload.body && payload.body.length > 10 * 1024 * 1024)
      )
        throw new Error('Invalid API request')
      const headers = new Headers({ 'Content-Type': 'application/json' })
      if (payload.token) headers.set('Authorization', `Bearer ${payload.token}`)
      const response = await net.fetch(target.toString(), {
        method: payload.method,
        headers,
        body: payload.body,
        signal: AbortSignal.timeout(30000),
        credentials: 'omit',
        redirect: 'error',
      })
      const reader = response.body?.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      if (reader)
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.byteLength
            if (size > 16 * 1024 * 1024)
              throw new Error('API response exceeds 16 MiB')
            chunks.push(value)
          }
        } finally {
          await reader.cancel()
        }
      return {
        status: response.status,
        body: Buffer.concat(chunks).toString('utf8'),
      }
    },
  )
}
