# Sound Live Site — Agent Guide

This repository publishes the independent static route `/sound/` as a read-only live consumer of the Soundscape backend. It must render real public recording data without copying records into the repository and must never alter `/soundscape/` or Panor Auth.

## First Read

1. Read `README.md`, `CONTEXT.md`, and `HOW-IT-WORKS.md`.
2. Read `docs/CONTENT_BRIEF.md` before changing visible presentation copy.
3. Read the `CLAUDE.md` sector card for every source directory you touch.
4. Run `npm run verify` before review.

`CLAUDE.md` at repository root is a symlink to this file.

## Product Guardrails

- **Backend data is canonical.** Titles, descriptions, media URLs, locations, coordinates, creators, dates, durations, rankings, and counts come only from the public Soundscape API.
- **Never add sample fallback rows.** Empty or unavailable live data must stay explicitly empty or unavailable.
- **Reject obvious non-production records once.** The domain quality rule excludes explicit test/demo/sample/placeholder/TBA title tokens before any public model is derived.
- **Preserve route ownership.** `/sound/` deploys independently and may call documented `/soundscape/api/` endpoints, but it must not edit, proxy, redirect, package, or deploy `/soundscape/`.
- **Do not duplicate auth.** Google, email/password login and registration, FedCM behavior, and `lang=zh-CN` remain owned by Panor unified auth v6 in `/soundscape/`.
- **Do not commit secrets.** This consumer needs none. Deployment credentials remain in the GitHub production environment.

## Architecture

```text
assets/application/      Load-orchestrate-render use case
assets/domain/           Backend normalization and derived live model
assets/infrastructure/   Public API and play-telemetry adapter
assets/ui/               Safe DOM, Leaflet, and audio player
assets/vendor/leaflet/   Reviewed vendored map runtime and license
test/                    Contract, domain, guard, and browser proof
```

Dependency direction is enforced by `scripts/repo-guards.sh`. `assets/main.js` is only the browser entry point. `site.config.js` owns presentation copy, limits, and endpoint addresses; it must not contain copied recording rows.

## Local Development

```bash
npm ci --ignore-scripts
python3 -m http.server 4173
npm run verify
```

Local Playwright intercepts the same-origin API paths with fixtures. Production proof runs after deployment:

```bash
npm run test:production
```

## Integration Contract

Approved runtime integrations are documented in `docs/CONTENT_BRIEF.md` and `docs/SECURITY.md`:

- Public Soundscape feed and ranking GETs.
- Anonymous play-duration POST.
- Vendored Leaflet with CARTO map tiles.
- Existing Monetag and Panor cross-promotion scripts.

Any new integration requires purpose, data flow, privacy posture, failure behavior, tests, and rollback documentation in the same pull request.

## Deployment Rules

- Work on a branch and merge through a pull request.
- `ci-success` must pass; the compatibility `verify` job remains while branch protection references it.
- A merge changing release files triggers the atomic production workflow.
- The workflow fingerprints `/soundscape/`, deploys only `/sound/`, runs static smoke checks, proves live rendering in Playwright, and rolls back on failure.

## Definition of Done

1. No recording-driven value is copied into configuration or markup.
2. Unit, contract, browser, guards, production policy, and registry checks pass.
3. The sector map resolves intended sectors with zero context-map findings.
4. Production renders the same titles, marker count, totals, and audio URLs returned by its live API calls.
5. `/soundscape/` and Panor unified auth v6 remain unchanged.
