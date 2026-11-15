export {}

declare global {
  interface Window {
    SERVER_URL: string | undefined
    HIDE_SERVER: boolean | undefined
    HIDE_ARTISTS_SECTION: boolean | undefined
    HIDE_SONGS_SECTION: boolean | undefined
    HIDE_ALBUMS_SECTION: boolean | undefined
    HIDE_GENRES_SECTION: boolean | undefined
    HIDE_FAVORITES_SECTION: boolean | undefined
    HIDE_PLAYLISTS_SECTION: boolean | undefined
    HIDE_RADIOS_SECTION: boolean | undefined
    APP_THEME: string | undefined
    APP_HIDE_THEMES: boolean | undefined
    IMAGE_CACHE_ENABLED: boolean | undefined
    DISABLE_IMAGE_CACHE_TOGGLE: boolean | undefined
    DISABLE_DOWNLOADS: boolean | undefined
    DISABLE_LRCLIB: boolean | undefined
  }
}
