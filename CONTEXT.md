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
- Audio playback: a controlled two-deck browser audio engine owned by `assets/ui/live-page.js`. One deck is active and one is standby; both may overlap only during a selected-recording crossfade.
- Map instance: one Leaflet instance created after its container is attached to the document.
- Deployment: GitHub Actions atomically replaces only `/sound/`; `/soundscape/` is fingerprinted before and after release.

## Listening Presentation

- **Compact turntable:** the persistent bottom-right listening surface shown while a recording is active. It remains visible while the page scrolls.
- **Focused turntable:** the larger centered listening surface opened from the compact turntable. Opening or closing it must not interrupt playback.
- A single click or tap on the compact vinyl opens the focused turntable. The vinyl itself is the accessible Expand button, so no double-click, double-tap, or separate duplicate Expand control exists.
- Closing the focused turntable collapses back to the compact turntable and preserves playback. Explicitly closing the compact turntable stops playback, finalizes its anonymous play telemetry, clears the active recording, and hides the player.
- While the focused turntable is open, the page behind it is inert and scroll-locked. Keyboard focus remains inside the focused player until Collapse or `Escape` returns to the compact turntable without stopping playback.
- The focused turntable is a near-full-viewport immersive listening surface rather than a contained dialog card. Its oversized platter may extend beyond a viewport edge, following the native turntable composition while preserving responsive tonearm and candidate geometry.
- The platter uses the native-reference monochrome vinyl treatment—dark record, restrained light grooves, and a simple center label. Backend cover images remain recording metadata and are not painted onto the record.
- The platter rotates continuously while a turntable is active, including while the tonearm is parked. Rotation does not represent playback progress. Reduced-motion preference disables continuous rotation without changing playback semantics.
- The tonearm is the foreground play/pause control. Moving it off the record pauses at the current position; returning it to the record resumes that same recording.
- Intentional vertical tonearm dragging browses selectable recordings in both compact and focused turntables. Compact browsing must stay confined to the tonearm hit target, begin only after the native-reference movement threshold, and must not capture ordinary page scrolling outside that target.
- In the focused turntable, browsing previews five ready candidates centered on the active selection. In the compact turntable, the same detent model previews only the centered candidate title inside the compact player, with no external candidate flyout.
- Current audio ducks to approximately 25% over 150 milliseconds while the user crosses candidate detents; releasing commits the centered candidate. Cancelling restores full volume over 150 milliseconds. Merely crossing a detent does not change the recording, and an unready candidate is never presented as selectable.
- Committing a different candidate performs an approximately 700-millisecond equal-power crossfade: the ducked outgoing live backend recording fades down while the selected live backend recording fades up on the standby deck, which then becomes active. No audio is copied, bundled, or synthesized by the website.
- The **listening queue** is the playable, deduplicated set of live recordings rendered in the section where playback began. Starting from Latest browses Latest; starting from Popular browses Popular. The player does not silently merge sections into a global queue.
- An active recording loops continuously at its natural end. Loop completion never auto-advances the section queue; changing recordings requires an intentional browse selection or selecting another recording card.
- Recording identity, metadata, artwork, audio, and selectable candidates continue to come only from the current live backend model.

## Failure Contract

Feed timeout, non-2xx responses, or schema drift produce an explicit unavailable state with Retry. Empty valid feeds do not fall back to copied records. Explicit test/demo titles are excluded. Failed play telemetry logs a warning but never interrupts audio playback.
