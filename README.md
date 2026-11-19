# Supernova Desktop

An independent desktop client for [Supernova Music](https://github.com/soltros/Supernova), built from the Aonsoku React/Electron interface.

This hard fork uses Supernova’s native REST API, bearer sessions, and resource-scoped media tickets. It does not support Subsonic servers.

## Development

Use Node.js 24+ and the pnpm version declared in package.json.

```sh
pnpm install
pnpm electron:dev
```

Web development: `pnpm dev`. Production renderer: `pnpm build`; desktop bundles: `pnpm electron:build`.

See [FORK.md](FORK.md) for provenance and [LICENSE.txt](LICENSE.txt) for the retained upstream MIT license.

## Mobile preview

The Capacitor app uses the same React renderer and Supernova server API as the
desktop client. Use your server's trusted HTTPS URL when signing in on mobile.
The mobile layout also runs in a narrow browser window with `pnpm dev`.

The **Build Mobile** GitHub Actions workflow publishes an Android debug APK and
an unsigned iPhone IPA as run artifacts. Extract the APK and install it on
Android. On iOS, extract the IPA and sign and install it with your personal Apple
account using a tool such as SideStore.

To build locally, run `pnpm build`, then `pnpm exec cap add android` or
`pnpm exec cap add ios` once. After subsequent web builds use
`pnpm exec cap sync android` or `pnpm exec cap sync ios`. Android requires the
Android SDK (API 36) and JDK 21. On macOS, run
`python3 scripts/prepare-ios.py` after generating the iOS project, then build
with Xcode.

This preview uses the shared web audio player. Test foreground playback,
seeking, screen locking, and track changes on real devices. ReplayGain is
currently desktop/web only.
