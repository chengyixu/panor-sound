# UI

Renders configured presentation copy and the derived live model with safe DOM APIs, accessible controls, Leaflet, and one two-deck turntable audio engine.

## Dependencies

- Receives normalized objects and callbacks; it does not fetch or parse backend rows.
- Leaflet is vendored under `assets/vendor/leaflet`.

## Invariants

- Recording cards are real `<button type="button">` controls.
- Leaflet initializes only after its container is connected and sized.
- Dynamic text uses `textContent`; failed covers render deterministic initials.
- Tracking failure never interrupts listening.
- Only the outgoing and selected live backend recordings may overlap, and only during the accepted crossfade window.
- Dragging is never the sole recording-selection path; the focused candidate buttons provide a single-pointer and keyboard alternative.
- The focused record stage and metadata occupy separate responsive grid regions; neither the record nor tonearm may overlap the metadata column.
- The tonearm is one nested physical hierarchy from pivot through needle, and focused candidates remain on the record groove without crossing its tonearm hit area.
