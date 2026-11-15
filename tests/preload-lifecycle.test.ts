import { beforeEach, expect, it, vi } from 'vitest'
const mocked = vi.hoisted(() => {
  const listeners = new Map<string, Set<(...args: any[]) => void>>()
  return {
    listeners,
    ipc: {
      on: vi.fn((channel: string, callback: (...args: any[]) => void) => {
        if (!listeners.has(channel)) listeners.set(channel, new Set())
        listeners.get(channel)!.add(callback)
      }),
      removeListener: vi.fn(
        (channel: string, callback: (...args: any[]) => void) =>
          listeners.get(channel)?.delete(callback),
      ),
      removeAllListeners: vi.fn(),
      invoke: vi.fn(),
      send: vi.fn(),
      once: vi.fn(),
    },
  }
})
vi.mock('electron', () => ({
  ipcRenderer: mocked.ipc,
  contextBridge: { exposeInMainWorld: vi.fn() },
}))
vi.mock('@electron-toolkit/preload', () => ({ electronAPI: {} }))
import '../electron/preload/index'
beforeEach(() => mocked.listeners.clear())
it('disposes only the download subscriber that unmounted', () => {
  const first = vi.fn(),
    second = vi.fn()
  const stopFirst = window.api.downloadCompletedListener(first)
  const stopSecond = window.api.downloadCompletedListener(second)
  stopFirst()
  for (const callback of mocked.listeners.get('download-completed') || [])
    callback(undefined, 'track-1')
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledWith('track-1')
  stopSecond()
  expect(mocked.listeners.get('download-completed')?.size).toBe(0)
})
it('does not accumulate update listeners across repeated mount cycles', () => {
  for (let i = 0; i < 50; i++) {
    const stopProgress = window.api.onDownloadProgress(() => {})
    const stopError = window.api.onUpdateError(() => {})
    const stopDone = window.api.onUpdateDownloaded(() => {})
    stopProgress()
    stopError()
    stopDone()
  }
  expect(
    [...mocked.listeners.values()].every((listeners) => listeners.size === 0),
  ).toBe(true)
})
