// Preserve original audio whenever the browser can decode it.
export function ensureSupportForAlac(suffix: string | undefined) {
  return suffix &&
    ['m4a', 'm4b', 'alac', 'aiff', 'aif', 'wma'].includes(suffix.toLowerCase())
    ? 'opus'
    : undefined
}
