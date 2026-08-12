# Content and Integration Brief

## Approved Decisions

| Topic | Approved value | Owner | Date |
|---|---|---|---|
| Site/product name | Soundscape | Yvonne + Wilson | 2026-07-28 |
| Primary audience | Urban explorers, sound enthusiasts, researchers, cultural recorders | Yvonne + Wilson | 2026-07-28 |
| Core value proposition | A public archive of field recordings anchored in real places | Wilson | 2026-08-10 |
| Recording content source | Live Soundscape public APIs only; no copied rows or fallback samples | Wilson | 2026-08-10 |
| Primary CTA | “Open Soundscape” → `https://www.panor.tech/soundscape/` | Wilson | 2026-08-10 |
| Required sections | Hero, latest public recordings, popular now, live map, archive totals, community recordists | Wilson | 2026-08-10 |
| Removed claims | Curated Editor’s Picks, Hall of Fame, libraries, team rankings, events, workshops, coming-soon dates | Wilson | 2026-08-10 |
| Visual direction | Minimal black and white, high contrast, immersive listening, accessible controls | Yvonne + Wilson | 2026-07-28 |
| Active-player presentation | Persistent compact turntable at bottom-right; a single click or tap on its vinyl expands it into a larger centered focused turntable without interrupting playback | Wilson | 2026-08-12 |
| Recording browse interaction | Intentional vertical tonearm dragging browses live recording candidates in both compact and focused turntables; ordinary page scrolling outside the tonearm remains unaffected | Wilson | 2026-08-12 |
| Browse selection contract | Focused mode shows five ready candidates; compact mode shows only the centered candidate title. Audio ducks to about 25% over 150ms and release commits the centered candidate | Wilson + native reference contract | 2026-08-12 |
| Recording transition | Committing a different candidate uses an approximately 700ms equal-power two-deck crossfade between live backend audio URLs; no media is copied into the website | Wilson + native reference contract | 2026-08-12 |
| Listening queue scope | Tonearm browsing stays within the live section where playback started—Latest or Popular—rather than merging sections into a global queue | Wilson | 2026-08-12 |
| Natural playback end | The active live recording loops continuously; reaching its media end never auto-advances the section queue | Native reference contract | 2026-08-12 |
| Focused-player access | The compact vinyl is one accessible Expand button activated by a single click, tap, Enter, or Space; no double-activation gesture or duplicate control | Wilson | 2026-08-12 |
| Player dismissal | Closing the focused turntable collapses to compact without interrupting audio; closing the compact turntable stops playback, sends final telemetry, and hides the player | Wilson | 2026-08-12 |
| Focused-player modality | The centered turntable makes the background inert and scroll-locked, contains keyboard focus, and collapses with Escape without stopping playback | Wilson | 2026-08-12 |
| Focused-player composition | Near-full-viewport immersive surface with an oversized platter that may extend beyond one edge; not a contained dialog card | Wilson | 2026-08-12 |
| Vinyl visual contract | Monochrome groove-and-label record derived from the native reference; cover art does not skin the platter, and reduced motion removes continuous rotation | Native reference contract | 2026-08-12 |
| Locale | English presentation; auth and application localization remain owned by `/soundscape/` | Wilson | 2026-08-10 |
| Launch owner | Wilson + Yvonne | Yvonne + Wilson | 2026-07-28 |

## Runtime Integrations

### Public Soundscape APIs

- Purpose: render current public recordings, rankings, audio, coordinates, totals, and contributors.
- Success signal: browser network contains both GETs and visible output equals those responses.
- Data sent: no user data on GET; play POST sends recording ID and rounded listened seconds only.
- Privacy posture: no account token, cookie dependency, fingerprint, or identity field is introduced by `/sound/`.
- Retention/opt-out: server-side play retention follows the existing Soundscape service; users can browse without playing, and failed telemetry does not block audio.
- Failure behavior: explicit unavailable state and Retry; never copied fallback content.
- Rollback: atomic restore of the previous `/sound/` release.

### Leaflet and CARTO Tiles

- Purpose: show real backend coordinates on an interactive geographic map.
- Success signal: visible non-zero markers plus at least one successful production tile response.
- Data sent: normal tile request metadata, including IP and user-agent, to CARTO; no Soundscape account identity is sent.
- Failure behavior: recording cards and audio remain usable if tiles fail.
- Rollback: restore the previous release; Leaflet is vendored and carries its license.

### Existing Site Scripts

Monetag zone `264769` and `/public/cross-promo.js` remain owner-approved existing integrations. No AdSense, new analytics provider, auth SDK, form provider, or cookie framework is added by this change.

## Non-Negotiable Copy Rules

- Static copy may describe the live archive and interaction.
- Dynamic titles, descriptions, creators, locations, counts, duration, audio, covers, rankings, and markers must come from the backend.
- Explicit test/demo/sample/placeholder/TBA records must not appear publicly.
- Missing backend values are described honestly; they are never replaced with invented facts.
