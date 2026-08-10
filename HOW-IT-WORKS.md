# How It Works

## Request Flow

1. `assets/main.js` enters the application layer.
2. `assets/application/bootstrap.js` renders static chrome, shows a loading state, and asks `SoundscapeApi` for both live public feeds.
3. `assets/infrastructure/soundscape-api.js` performs timeout-bound, no-cache requests and validates each response through domain parsers.
4. `assets/domain/soundscape.js` normalizes the backend wire fields, excludes explicit test/demo records, deduplicates IDs, and derives latest recordings, current popularity, map points, archive totals, and contributor summaries.
5. `assets/ui/live-page.js` renders accessible recording buttons, initializes Leaflet after the map is attached, and opens the shared audio player.
6. Closing, replacing, ending, or leaving a played recording sends one anonymous `listened_sec` event through the API adapter.

## Single Source of Truth

Recording titles, descriptions, audio URLs, covers, locations, coordinates, creators, dates, durations, saves, and play counts exist only in the Soundscape backend. `site.config.js` contains presentation copy, limits, and endpoint addresses; it must never contain copied recording rows. A valid empty or failed backend response stays empty or failed instead of reverting to static examples.

## Verification

- Unit and contract tests pin normalization, ranking, filtering, and derived statistics.
- The fixture-backed Playwright test at `test/e2e/live-page.e2e.test.mjs` proves both API requests, visible markers, keyboard-accessible cards, audio playback wiring, play telemetry, and explicit failure UI.
- Repository guards block stale snapshot copy, fake map/event text, copied wire fields, layer inversion, and missing no-bugs-first artifacts.
- Production policy checks metadata, route isolation, vendored Leaflet assets, and the live-data module chain.
- Post-deploy Playwright captures the actual production API responses and proves the rendered card order, marker count, tile loading, archive totals, and player source match those same responses.
