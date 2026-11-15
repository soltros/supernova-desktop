import { app, BrowserWindow, ipcMain } from 'electron'
import { download } from 'electron-dl'
import { IpcChannels } from '../../preload/types'

export interface IDownloadPayload {
  url: string
  fileId: string
}

export function setupDownloads(window: BrowserWindow | null) {
  ipcMain.removeAllListeners(IpcChannels.HandleDownloads)
  ipcMain.on(
    IpcChannels.HandleDownloads,
    async (event, payload: IDownloadPayload) => {
      if (
        !window ||
        event.sender !== window.webContents ||
        event.senderFrame !== window.webContents.mainFrame
      )
        return

      const { url, fileId } = payload

      try {
        const target = new URL(url)
        if (
          !['http:', 'https:'].includes(target.protocol) ||
          target.username ||
          target.password ||
          !target.searchParams.get('ticket') ||
          !/\/api\/download\/(track|album)\/[^/]+$/.test(target.pathname)
        )
          throw new Error('Invalid download URL')
        const downloadsPath = app.getPath('downloads')

        await download(window, url, {
          directory: downloadsPath,
          onCompleted: () => {
            window.webContents.send(IpcChannels.DownloadCompleted, fileId)
          },
        })
      } catch {
        window.webContents.send(IpcChannels.DownloadFailed, fileId)
      }
    },
  )
}
