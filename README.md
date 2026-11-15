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
