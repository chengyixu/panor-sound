# UI

Renders configured presentation copy and the derived live model with safe DOM APIs, accessible controls, Leaflet, and one shared audio player.

## Dependencies

- Receives normalized objects and callbacks; it does not fetch or parse backend rows.
- Leaflet is vendored under `assets/vendor/leaflet`.

## Invariants

- Recording cards are real `<button type="button">` controls.
- Leaflet initializes only after its container is connected and sized.
- Dynamic text uses `textContent`; failed covers render deterministic initials.
- Tracking failure never interrupts listening.
