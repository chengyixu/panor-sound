# Developer Handoff

## Goal

Build and publish an owner-approved static marketing page at `/sound/` without modifying the independent `/soundscape/` site.

Work on a feature branch and open a pull request. Do not run the production publisher from a developer workstation. CI verifies every PR; a reviewed merge to `main` automatically deploys changes to `index.html`, `site.config.js`, or `assets/`.

This repository supplies a deployable shell, not product requirements. First resolve all required entries in `docs/CONTENT_BRIEF.md`.

## First 15 Minutes

```bash
git clone https://github.com/chengyixu/panor-sound.git
cd panor-sound
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
7. Complete `panor/product.json` with the approved product name, descriptions, category, and cross-promotion metadata.
8. Add the required canonical, OG, Twitter, product JSON-LD, breadcrumb JSON-LD, organization reference, and 150–300 word noscript fallback to `index.html`.
9. Keep the approved Monetag zone `264769` and `/public/cross-promo.js`; do not add AdSense.
10. Set `publish.ready` to `true` only after owner approval, then run `node scripts/verify-site.mjs --production`.
11. Push the branch and open a pull request using `.github/pull_request_template.md`.
12. Resolve CI and review feedback. The reviewed merge to `main` automatically deploys release-file changes; do not copy files to production manually.

## Change Checklist

- [ ] Every visible claim is owner-approved.
- [ ] No new integration, tracker, or data collection was added implicitly.
- [ ] No legacy `/soundscape/` path was introduced.
- [ ] Media has a known license and meaningful alt text where relevant.
- [ ] Links use safe, approved destinations.
- [ ] `panor/product.json` matches the approved public copy.
- [ ] SEO, structured data, Monetag, cross-promotion, and noscript requirements pass production verification.
- [ ] `node scripts/verify-site.mjs` passes.
- [ ] `node scripts/test-panor-registry.mjs` passes.
- [ ] `node scripts/verify-site.mjs --production` passes for a release PR.
- [ ] The PR records approval, integration/data-flow changes, and rollback impact.

## Merge and Deployment

- `main` is protected: required CI, owner/code-owner review, resolved conversations, no force pushes, and no deletion.
- Documentation-only changes do not deploy the site.
- Merging changes to `index.html`, `site.config.js`, or `assets/` starts `Deploy production` automatically.
- The workflow updates all Panor registration surfaces, smoke-tests production, confirms `/soundscape/` is unchanged, and rolls back a failed launch.
- The developer watches the Actions run but never receives or handles the production SSH key.
- See `CONTRIBUTING.md` for the complete public collaboration flow and `docs/DEPLOYMENT.md` for infrastructure details.
