import { ElectronAPI } from '@electron-toolkit/preload'
import { ISupernova DesktopAPI } from '../../electron/preload/types'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ISupernova DesktopAPI
    envVars: {
      XDG_CURRENT_DESKTOP: string | undefined
    }
  }
}
