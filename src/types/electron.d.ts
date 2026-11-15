import { ElectronAPI } from '@electron-toolkit/preload'
import { ISupernovaAPI } from '../../electron/preload/types'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ISupernovaAPI
    envVars: {
      XDG_CURRENT_DESKTOP: string | undefined
    }
  }
}
