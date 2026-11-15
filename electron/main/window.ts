import { installApiBridge } from './core/supernova'
import { is, platform } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'
import { join } from 'path'
import { electron } from '../../package.json'
import { colorsState } from './core/colors'
import { setupDownloads } from './core/downloads'
import { setupEvents, setupIpcEvents } from './core/events'
import { appIcon } from './core/icon'
import { titleBarOverlay } from './core/titleBarOverlay'
import { setUpdaterWindow } from './core/updater'
import { StatefulBrowserWindow } from './core/windowPosition'
import { updateDockMenu } from './core/dockMenu'
import { playerState } from './core/playerState'
import { createTray } from './tray'

export let mainWindow: BrowserWindow | null = null

const { defaultWidth, defaultHeight, defaultBgColor } = electron.window

export function createWindow(): void {
  const backgroundColor = colorsState.get('bgColor') ?? defaultBgColor

  mainWindow = new StatefulBrowserWindow({
    width: defaultWidth,
    height: defaultHeight,
    minWidth: defaultWidth,
    minHeight: defaultHeight,
    backgroundColor,
    supportMaximize: true,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    visualEffectState: 'followWindow',
    roundedCorners: true,
    frame: false,
    ...(platform.isWindows ? { titleBarOverlay } : {}),
    trafficLightPosition: { x: 15, y: 14 },
    icon: appIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  installApiBridge(mainWindow)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== mainWindow?.webContents.getURL().split('#')[0])
      event.preventDefault()
  })
  mainWindow.webContents.on('will-attach-webview', (event) =>
    event.preventDefault(),
  )
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  )
  // set initial state
  playerState.setAll({
    isPlaying: false,
    hasSonglist: false,
    hasPrevious: false,
    hasNext: false,
  })

  createTray()
  updateDockMenu()
  setupEvents(mainWindow)
  setupIpcEvents(mainWindow)
  setupDownloads(mainWindow)
  setUpdaterWindow(mainWindow)

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/',
    })
  }
}
