# Application

Composes the live page use case: load both public feeds, build one domain model, render it, and surface unavailable states.

## Dependencies

- May import `domain`, `infrastructure`, and `ui` public modules.
- Owns orchestration only; it does not parse wire rows or create DOM structures itself.

## Invariants

- No copied recording fallback.
- One load operation drives all recording-derived sections.
- Backend errors become the explicit Retry state.
