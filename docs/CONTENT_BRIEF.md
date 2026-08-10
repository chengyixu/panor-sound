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
