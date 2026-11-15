import { electron } from '../../../package.json'
import { Supernova DesktopStore } from './store'

interface State {
  bgColor: string
}

const colorsStore = new Supernova DesktopStore<State>({
  name: 'colors',
  defaults: {
    bgColor: electron.window.defaultBgColor,
  },
})

function get<T extends keyof State>(key: T): State[T] {
  return colorsStore.get(key)
}

function set<T extends keyof State>(key: T, status: State[T]) {
  colorsStore.set(key, status)
}

export const colorsState = {
  get,
  set,
  value: () => colorsStore.store,
}
