# How It Works

## Request Flow

1. `assets/main.js` enters the application layer.
2. `assets/application/bootstrap.js` renders static chrome, shows a loading state, and asks `SoundscapeApi` for both live public feeds.
3. `assets/infrastructure/soundscape-api.js` performs timeout-bound, no-cache requests and validates each response through domain parsers.
4. `assets/domain/soundscape.js` normalizes the backend wire fields, excludes explicit test/demo records, deduplicates IDs, and derives latest recordings, current popularity, map points, archive totals, and contributor summaries.
5. `assets/ui/live-page.js` renders accessible recording buttons, initializes Leaflet after the map is attached, and presents the two-deck audio engine through a persistent compact turntable.
6. A single click, tap, Enter, or Space activation on the compact vinyl opens a near-full-viewport modal listening surface without replacing the audio engine or interrupting playback; the background becomes inert and scroll-locked, focus remains inside until collapse, and the oversized platter may extend beyond one viewport edge.
7. The platter rotates only while playback is active. Parking the needle pauses both audio and platter motion; reduced-motion preference keeps it static without changing playback.
8. The focused player uses one responsive deck grid: the platter and connected pivot → arm → cartridge → needle hierarchy stay in the stage, while metadata remains in a separate non-overlapping region.
9. Intentional vertical tonearm dragging uses the same ready-candidate detents in either presentation: focused mode bends five candidates along a concave record groove without crossing the tonearm, while compact mode previews only the centered candidate title inside the player.
10. Browsing ducks the current audio to approximately 25% over 150 milliseconds while candidate detents move through the center; releasing a different centered candidate starts it on the standby deck and performs an approximately 700-millisecond equal-power crossfade, while cancelling restores the original recording over 150 milliseconds.
11. The browse candidates come from the playable live recordings in the section that initiated playback, so Latest and Popular remain distinct listening queues.
12. Reaching the active recording's media end reports the completed listen and restarts that same recording; it never advances the queue automatically.
13. `Escape` or Collapse closes the focused turntable only; closing the compact turntable stops audio, sends final telemetry, clears the shared player, and hides the presentation.
14. Replacing or leaving a played recording sends one anonymous `listened_sec` event through the API adapter; each crossfaded recording is measured from its own active listening interval.

## Single Source of Truth

Recording titles, descriptions, audio URLs, covers, locations, coordinates, creators, dates, durations, saves, and play counts exist only in the Soundscape backend. `site.config.js` contains presentation copy, limits, and endpoint addresses; it must never contain copied recording rows. A valid empty or failed backend response stays empty or failed instead of reverting to static examples.

## Verification

- Unit and contract tests pin normalization, ranking, filtering, and derived statistics.
- The fixture-backed Playwright test at `test/e2e/live-page.e2e.test.mjs` proves both API requests, visible markers, keyboard-accessible cards, audio playback wiring, play telemetry, and explicit failure UI.
- Repository guards block stale snapshot copy, fake map/event text, copied wire fields, layer inversion, and missing no-bugs-first artifacts.
- Production policy checks metadata, route isolation, vendored Leaflet assets, and the live-data module chain.
- Post-deploy Playwright captures the actual production API responses and proves the rendered card order, marker count, tile loading, archive totals, and player source match those same responses.
