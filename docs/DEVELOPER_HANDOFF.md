# Developer Handoff

## Goal

Build and publish an owner-approved static marketing page at `/sound/` without modifying the independent `/soundscape/` site.

Work on a feature branch and open a pull request. Do not run the production publisher from a developer workstation. CI verifies every PR; a reviewed merge to `main` automatically deploys changes to `index.html`, `site.config.js`, or `assets/`.

This repository supplies a deployable shell, not product requirements. First resolve all required entries in `docs/CONTENT_BRIEF.md`.

## First 15 Minutes

```bash
git clone <repository-url>
cd sound
cat AGENTS.md
cat docs/CONTENT_BRIEF.md
python3 -m http.server 4173
node scripts/verify-site.mjs
```

Then inspect `site.config.js`. Do not replace placeholders with invented claims.

## Agent Prompt

For Codex or Claude Code, paste:

> Read `AGENTS.md`, `README.md`, `docs/DEVELOPER_HANDOFF.md`, and `docs/CONTENT_BRIEF.md`. This is a neutral static marketing site at `/sound/`. Do not assume product features, backend services, 3D, analytics, legal copy, or CTA targets. Identify missing owner decisions before changing visible content. Use the relevant skill under `skills/`.

Optional project-skill installation:

```bash
./scripts/install-agent-skills.sh --target claude
./scripts/install-agent-skills.sh --target codex
```

Use `--help` if the agent runtime stores skills outside its conventional local directory.

## Implementation Workflow

1. Capture approved answers in `docs/CONTENT_BRIEF.md`.
2. Update `site.config.js`; this is the visible-copy source of truth.
3. Add only approved sections and media.
4. Keep the static architecture unless an integration has a documented purpose, privacy review, failure behavior, and rollback plan.
5. Run `node scripts/verify-site.mjs`.
6. Test keyboard navigation, narrow mobile layout, desktop layout, all links, and any consent behavior.
7. Set `publish.ready` to `true` only after owner approval, then run `node scripts/verify-site.mjs --production`.
8. Follow `docs/DEPLOYMENT.md` for a separately approved release.

## Change Checklist

- [ ] Every visible claim is owner-approved.
- [ ] No new integration, tracker, or data collection was added implicitly.
- [ ] No legacy `/soundscape/` path was introduced.
- [ ] Media has a known license and meaningful alt text where relevant.
- [ ] Links use safe, approved destinations.
- [ ] `node scripts/verify-site.mjs` passes.
- [ ] Production approval and rollback owner are recorded.
