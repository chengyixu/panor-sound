# Domain

Owns the canonical conversion from Soundscape wire records to the public `/sound/` model.

## Dependencies

- Browser-free and deterministic.
- Must not import application, infrastructure, UI, DOM, or network APIs.

## Invariants

- Required IDs, titles, and audio URLs fail loudly when invalid.
- Explicit test/demo records are filtered once before every derived surface.
- Latest, popular, map, statistics, and contributors derive only from normalized backend rows.
