# Developer Handoff

## Goal

Maintain the owner-approved live Soundscape discovery page at `/sound/` without modifying the independent `/soundscape/` application or Panor unified auth v6.

## First 15 Minutes

```bash
git clone https://github.com/chengyixu/panor-sound.git
cd panor-sound
cat AGENTS.md CONTEXT.md HOW-IT-WORKS.md
npm ci --ignore-scripts
npm run verify
```

## Change Workflow

1. Update `docs/CONTENT_BRIEF.md` for any new visible claim or integration.
2. Keep presentation copy and endpoint addresses in `site.config.js`.
3. Keep backend wire normalization and public filtering in `assets/domain/soundscape.js`.
4. Never copy a production recording row into configuration, markup, CSS, or UI code.
5. Add RED-first unit/contract/browser coverage for behavioral changes.
6. Update `scripts/repo-guards.sh`, the bug catalog, and sector map when an invariant or architecture boundary changes.
7. Run `npm run verify` from a clean install.
8. Push a feature branch and open a pull request; never deploy from a developer workstation.

## Release Contract

Merging a pull request that changes release files triggers production deployment. The workflow packages only `/sound/`, captures `/soundscape/` before and after, runs static smoke checks, then uses Playwright to prove production requested both real APIs and rendered matching cards, markers, totals, tiles, and audio. Any failure triggers atomic rollback.

Login, registration, Google FedCM, email/password flows, and Chinese language detection are outside this repository. The CTA links to the existing application; do not add auth code here.
