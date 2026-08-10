# ADR 0001: Render `/sound/` from the Live Soundscape Backend

- Status: Accepted
- Date: 2026-08-10

## Context

The original `/sound/` release presented copied recording titles, locations, counts, event text, and a map placeholder. It made no backend request, had no usable audio interaction, and could pass CI while production remained stale. The independent `/soundscape/` application already owns the canonical public recording and ranking APIs, publishing workflow, and Panor unified auth v6.

## Decision

`/sound/` remains a separately deployed static site, but it becomes a read-only live consumer of the public Soundscape API. The page requests the explore feed and rankings feed on every load, derives all recording-driven sections in the domain layer, renders a real Leaflet map from backend coordinates, and sends anonymous play duration to the existing play endpoint.

`site.config.js` owns presentation copy and endpoint addresses only. It never stores copied recording rows. Explicit test/demo records are rejected by one domain rule before they can affect cards, markers, statistics, or contributors. Backend failure produces an explicit retry state; there is no static-data fallback.

The Soundscape application and auth implementation are not modified. Login, registration, Google FedCM, localization, creation, and publishing remain behind the existing `/soundscape/` handoff.

## Consequences

- Production content changes with backend data without a `/sound/` redeploy.
- Backend schema drift fails visibly and turns contract tests red.
- The page requires JavaScript for live data, audio, and mapping; noscript text describes the limitation without inventing a snapshot.
- CARTO tile availability affects map imagery but not recording cards or audio.
- Deployment verification must include a real browser, not string-only HTML checks.

## Rejected Alternatives

- Keep hand-maintained featured rows: rejected because it duplicates canonical records and inevitably drifts.
- Proxy or modify `/soundscape/`: rejected because `/sound/` has an explicit route-isolation boundary.
- Fall back to bundled sample records: rejected because a green-looking stale page is worse than an honest unavailable state.
- Add auth to `/sound/`: rejected because Panor Auth v6 is already owned and served by `/soundscape/`.
