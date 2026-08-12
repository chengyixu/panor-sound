# Tests

Pins the live-data contract from domain normalization through a real browser and production deployment.

## Test Cells

- `contract/`: backend wire-shape acceptance and loud drift failure.
- `domain/`: derivation, quality filtering, statistics, and required audio.
- `guards/`: source-of-truth and placeholder regression checks.
- `e2e/live-page.e2e.test.mjs`: hermetic browser boundary with fixture APIs.
- `e2e/turntable-player.e2e.test.mjs`: compact/focused turntable, connected tonearm geometry, concave on-record queue, crossfade, motion, desktop/mobile overlap prevention, activation, and telemetry contract.
- `e2e/production-live-page.e2e.test.mjs`: post-deploy proof against actual production responses.

Fixtures model the API boundary; they are test data only and must never be imported by production assets.
