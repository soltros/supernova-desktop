# Desktop migration checkpoint

The native Supernova migration now passes real-server browser and Electron smoke tests. Nothing has been pushed by the agent.

Verified with a disposable Supernova server: login, library browsing, favorites, playlist contents, creation through the UI, ticketed streaming, and actual player pause/resume. Renderer and Electron type checks, both production builds, and 16 contract/lifecycle tests pass.

The earlier blank smoke screen came from development module requests aborted by host network changes; smoke tests now use the built renderer. Native smoke startup also needed to launch the package root rather than the compiled entry file so Electron resolves the resource directory correctly.

Native metadata summaries and favorite state are hydrated from the API. Unsupported genre/most-played filters, public playlists, metadata editing, and playlist ZIP downloads are not presented as supported actions. Original audio streams directly when supported; compatibility transcoding is limited to formats the browser cannot decode. Session changes reject stale responses and media tickets. Desktop download/update subscriptions now have cleanup paths.

Next verification: finish unpacked package validation, remove obsolete settings for external services/caches, and add repeatable CI/documentation. Native macOS/Windows installers remain platform-specific checks.

Diagnostics and screenshots are under /tmp/supernova-desktop-*.
