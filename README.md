# Soundscape Live Archive

`/sound/` is Panor’s public, read-only discovery page for the live Soundscape archive. The site itself is statically deployed, but every recording-driven surface is built at runtime from the canonical Soundscape backend.

## Live Data Contract

- Latest published recordings: `/soundscape/api/soundscapes?scope=explore`
- Current popularity: `/soundscape/api/rankings`
- Anonymous listening telemetry: `POST /soundscape/api/soundscapes/{id}/play`
- Real geographic markers: backend `lat` and `lng`
- Audio and covers: backend-owned URLs
- Archive totals and contributors: derived in-browser from the current public feed

`site.config.js` contains presentation copy, limits, and endpoint addresses only. It contains no recording rows, copied counts, fake events, or map locations. Explicit backend test/demo records are removed by the domain quality rule before cards, rankings, markers, totals, or contributors are built.

## Route Boundary

The repository deploys only `https://www.panor.tech/sound/`. The existing `https://www.panor.tech/soundscape/` application remains the owner of data, recording, publishing, and Panor unified auth v6. This repository does not change Google login, email/password login or registration, FedCM, or Chinese language detection.

## Architecture

```text
assets/application/      Runtime orchestration
assets/domain/           Wire normalization and live model
assets/infrastructure/   API and telemetry adapter
assets/ui/               Accessible cards, map, and two-deck turntable player
assets/vendor/leaflet/   Vendored map dependency
test/                    Contract, domain, guard, and browser tests
```

See `HOW-IT-WORKS.md` for request flow and `CONTEXT.md` for environment and failure contracts.

## Development

```bash
npm ci --ignore-scripts
npm run verify
```

To inspect locally while using the fixture-backed browser test:

```bash
python3 -m http.server 4173
# open http://127.0.0.1:4173/
```

Individual checks:

```bash
npm run check:syntax
npm test
npm run test:e2e
bash scripts/repo-guards.sh
node scripts/verify-site.mjs --production
node scripts/test-panor-registry.mjs
```

The post-deploy workflow additionally runs `npm run test:production`, which captures the actual production API responses and proves the rendered card order, marker count, tiles, totals, active turntable deck URL, and focused-player metadata match them.

## Deployment

All product work goes through a pull request. GitHub Actions runs independent blocking lanes and an aggregate `ci-success` check. A merged release change deploys atomically to `/sound/`, verifies Panor registry surfaces, confirms `/soundscape/` is byte-for-byte unchanged during the release, and rolls back if static or browser smoke tests fail.

Infrastructure and recovery details live in `docs/DEPLOYMENT.md`.
