# Runtime Context

## Purpose

`/sound/` is a static, read-only discovery surface for the live Soundscape service. It renders current public recordings and rankings without owning or copying Soundscape records. The existing `/soundscape/` application remains the only place for account access, recording, publishing, and Panor unified auth v6.

## Runtime Boundaries

- Page route: `https://www.panor.tech/sound/`
- Public recording feed: `/soundscape/api/soundscapes?scope=explore`
- Public rankings feed: `/soundscape/api/rankings`
- Anonymous play event: `POST /soundscape/api/soundscapes/{id}/play`
- Map tiles: CARTO HTTPS raster tiles configured in `site.config.js`
- Creation/auth handoff: `https://www.panor.tech/soundscape/`

No API key, cookie, account token, database credential, or auth configuration is required by this repository. The play event sends only the selected recording ID in the URL and rounded `listened_sec` in JSON.

## Development and Production

Local development serves the repository at `/`, while production serves the same files at `/sound/`. All asset references are relative so the artifact is identical in both environments. API paths are same-origin absolute paths and therefore reach the production Soundscape backend only when hosted on `www.panor.tech`; Playwright uses intercepted fixtures for the hermetic local browser contract.

```bash
npm ci --ignore-scripts
npm run verify
```

Production parity adds the real browser proof after deployment:

```bash
npm run test:production
```

## Resource Ownership

- Local test server: TCP `127.0.0.1:4173`, owned and terminated by `test/e2e/live-page.mjs`.
- Audio playback: one browser `<audio>` element owned by `assets/ui/live-page.js`.
- Map instance: one Leaflet instance created after its container is attached to the document.
- Deployment: GitHub Actions atomically replaces only `/sound/`; `/soundscape/` is fingerprinted before and after release.

## Failure Contract

Feed timeout, non-2xx responses, or schema drift produce an explicit unavailable state with Retry. Empty valid feeds do not fall back to copied records. Explicit test/demo titles are excluded. Failed play telemetry logs a warning but never interrupts audio playback.
