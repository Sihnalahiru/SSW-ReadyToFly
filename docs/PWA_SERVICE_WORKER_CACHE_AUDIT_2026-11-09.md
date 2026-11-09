# ReadyToFly Service Worker and PWA Cache Audit

**Date:** 2026-11-09  
**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Scope:** Static review of `public/sw.js`, `public/index.html`, `public/manifest.json`, Wrangler asset configuration, and the live branch tree. No browser/device runtime test was performed.

## Core cache asset integrity

The service worker's 15 core asset entries were checked against the repository tree:
- All referenced same-origin files exist, including the app shell, six app modules, manifest, and three Lottie files.
- No missing core cache path was found.
- `public/app/auth.js` exists and is included in the cache list; the current main app shell has its own auth controller in `public/app.js`, so the adapter module is retained but is not imported by the current shell.

## Request handling

Static code inspection confirms:
- Non-GET requests are not intercepted by the service worker.
- Cross-origin requests are not cached by this service worker.
- `/api/*` requests are excluded from cache handling.
- Cache-first responses are used for same-origin GET requests.
- A network failure for a navigation request falls back to cached `index.html`.
- A network failure for a missing JS/CSS/image or other non-navigation asset returns HTTP 503 rather than HTML, avoiding a misleading MIME-type fallback.

## PWA scope and limitations

- The manifest sets standalone display and portrait-primary orientation.
- The Wrangler asset directory is `./public`, matching the deployed static asset tree.
- The PWA is **app-shell cached, not a full offline study application**. The Study, Vocabulary, Quiz and Progress screens remain placeholders and verified content has not been wired into them.
- The Lottie player module is loaded from the external unpkg CDN in `index.html`. It is not part of the same-origin service-worker cache. When offline, animation playback may be unavailable even if the cached shell loads.
- Cache-first behavior means a changed same-origin asset can remain stale until the service worker/cache version is updated and activated. A future release should deliberately bump the cache version and test the update lifecycle.
- Cache installation uses `cache.addAll(CORE_ASSETS)`; although all listed paths exist in the repository tree, successful HTTP retrieval and installation have not been runtime-tested.

## Release assessment

| Check | Result |
|---|---|
| Core cache paths exist in Git tree | VERIFIED |
| API requests excluded from SW cache | VERIFIED by code inspection |
| Cross-origin requests excluded | VERIFIED by code inspection |
| Navigation fallback behavior | VERIFIED by code inspection |
| Full offline learning | NOT IMPLEMENTED |
| External Lottie runtime while offline | NOT AVAILABLE / NOT CACHED |
| Browser install/update lifecycle | PENDING runtime test |
| Mobile Safari / Android browser behavior | PENDING runtime test |

## Required runtime tests before release

1. Install the app online and confirm all core assets are cached successfully.
2. Reload offline and confirm the shell renders without claiming study content is available.
3. Confirm API requests fail safely offline and are never served from Cache Storage.
4. Deploy a new cache version and verify old cache cleanup and client takeover.
5. Verify Lottie behavior with network available and unavailable.
6. Test installability and navigation on iOS Safari and Android Chrome.

## Preservation

This is a report-only audit. No service-worker code, cache version, manifest, source content, or asset was changed. No production deployment, D1 migration, content import, or PR merge was performed.
