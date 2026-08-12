# ADR 0002: Use a Two-Deck Turntable Player on `/sound/`

- Status: Accepted
- Date: 2026-08-12

## Context

The Sound page previously exposed one browser audio element through a conventional fixed control panel. The accepted listening interaction replaces that panel with a persistent compact turntable and a near-full-viewport focused turntable modeled on the native Soundscape player. Selecting a new recording must feel continuous rather than stopping one source before another begins.

A true crossfade requires the outgoing and incoming recordings to overlap briefly. Retaining one audio element would force a fade-out, source replacement, and fade-in with an audible discontinuity. Adding a general audio or animation framework would expand the integration and failure surface without changing the backend contract.

## Decision

`assets/ui/live-page.js` owns a dependency-free two-deck browser audio engine. One deck is active and one is standby. Both decks may contain live backend audio simultaneously only during an approximately 700-millisecond equal-power crossfade after a deliberate candidate selection. When the transition completes, the outgoing deck is measured, stopped, cleared, and returned to standby.

The player keeps queue identity with the section that initiated playback. Browse mode ducks the active deck to approximately 25% over 150 milliseconds. A failed incoming `play()` leaves the outgoing recording selected and restores its volume. Closing the compact player stops and clears both decks while telemetry continues asynchronously.

The compact vinyl opens focused mode with one click, tap, Enter, or Space. Tonearm dragging is optional: focused candidate buttons and keyboard arrow actions provide non-drag alternatives. Reduced-motion preference removes continuous platter rotation without changing playback state.

## Consequences

- Track changes can match the native continuous-listening feel without copying or bundling media.
- At most two backend media URLs are active, and only during the bounded transition window.
- Telemetry is tracked per deck generation so outgoing and incoming listening intervals cannot share one report.
- The UI layer has more state than a single media element and therefore requires dedicated browser regression coverage for interrupted transitions, deck handoff, dismissal, and looping.
- Browser autoplay or media failures remain observable in player state rather than silently replacing the active recording.

## Rejected Alternatives

- Single-deck fade-out and fade-in: rejected because the source switch creates a perceptible gap and does not match the accepted native transition.
- Web Audio graph over fetched buffers: rejected because it adds CORS, memory, decoding, and readiness complexity for backend-owned media.
- Third-party audio or animation framework: rejected because native media elements, volume automation, CSS transforms, and Pointer Events satisfy the contract without a new runtime integration.
