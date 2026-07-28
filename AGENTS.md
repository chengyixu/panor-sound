# Sound Marketing Site — Agent Guide

This repository is a **neutral, static marketing-site scaffold**. It deliberately does not assume an app, API, login flow, analytics provider, database, 3D experience, product category, or approved marketing claims.

## First Read

1. Read `README.md` for the contract and local commands.
2. Read `docs/CONTENT_BRIEF.md` before inventing copy, visuals, sections, CTAs, or integrations.
3. Read the relevant project skill under `skills/`.
4. Keep the production path in `site.config.js` aligned with the deployment config. The currently requested production path is `/sound/`.

`CLAUDE.md` is a symlink to this file so Claude Code and Codex receive the same project rules.

## Product Guardrails

- **Do not invent product facts.** Use explicit placeholders until the owner approves the value proposition, audience, claims, CTA destination, legal links, language, and visual direction.
- **Do not assume a backend.** Add an API, form provider, mailing-list service, analytics, cookies, auth, database, or third-party SDK only after a documented decision.
- **Do not assume 3D.** The site has no 3D/runtime graphics dependency. Treat rich media as optional content, never as a deployment prerequisite.
- **Do not reuse `/soundscape/`.** This repository publishes independently at `/sound/`; it must not alter, proxy, redirect, or deploy the existing `/soundscape/` website.
- **Do not commit secrets.** Keep tokens, deployment hosts, destination paths, CMS keys, analytics IDs, and private assets outside Git. Use environment variables or the deployment platform’s secret store.

## Architecture

```text
index.html             Minimal semantic page shell
site.config.js         Approved copy, navigation, sections, CTAs, base path
assets/main.js         Safe DOM rendering from site.config.js
assets/styles.css      Responsive visual system
deploy/                Generic Nginx template + opt-in static publisher
scripts/               Verification and agent-skill installation
skills/                Portable project skills for Claude Code and Codex
docs/                  Brief, handoff, deployment, and security contracts
```

Do not hard-code marketing copy in `index.html` or `assets/main.js`. Put approved content in `site.config.js`, then render it using DOM APIs and `textContent`.

## Local Development

The site needs only a modern browser, Python 3, and Node 18+ for verification.

```bash
# From repository root
python3 -m http.server 4173
# Open http://localhost:4173/

# Structural and route-contract checks
node scripts/verify-site.mjs

# Require approved non-placeholder content before a production release
node scripts/verify-site.mjs --production
```

The local server runs at `/`. Production is served at `/sound/`; use relative asset paths so both work.

## Content and UX Changes

1. Update `docs/CONTENT_BRIEF.md` if an owner supplies a new product decision.
2. Put approved content and links in `site.config.js`.
3. Add layout only when it serves an approved section or conversion goal.
4. Preserve keyboard navigation, visible focus, semantic headings, contrast, and responsive behavior.
5. Run `node scripts/verify-site.mjs` and manually test desktop plus a narrow mobile viewport.

Use safe URLs only. `assets/main.js` rejects `javascript:` URLs, but it is still the developer’s responsibility to use owner-approved destinations.

## Adding Integrations

Before adding any integration, document these items in the pull request and `docs/CONTENT_BRIEF.md`:

- Purpose and owner-approved success metric.
- Data collected, legal basis, retention, and opt-out behavior.
- New environment variables and where they are configured.
- Failure behavior when the integration is unavailable.
- Test and rollback plan.

Load third-party scripts only after consent and only when the site has an approved privacy policy.

## Deployment Rules

- `/sound/` is a separate static directory. It must never overwrite `/soundscape/`.
- `deploy/publish-static.sh` is intentionally inert until an operator supplies all deployment environment variables and passes `--apply`.
- Do not deploy on behalf of an owner merely because the repository is ready. Obtain explicit production approval for each release.
- Render the Nginx template with `deploy/render-nginx-config.mjs`, run `nginx -t`, then reload only after the syntax check passes.
- Before release: clean Git state, verification pass, content approval, backup/rollback readiness, and a post-deploy smoke test.

See `docs/DEPLOYMENT.md` for the full procedure and `skills/marketing-site-deploy/SKILL.md` for an agent-run checklist.

## Git Workflow

- Make focused commits; never mix content, infrastructure, and unrelated formatting changes.
- Do not force-push shared branches or rewrite history without explicit approval.
- Keep generated output, local configuration, and credentials untracked.
- A reviewer should be able to understand every visible claim from `site.config.js` and `docs/CONTENT_BRIEF.md`.

## Definition of Done

A change is ready only when:

1. It matches an approved content brief rather than an invented assumption.
2. It works at a narrow mobile viewport and a desktop viewport.
3. Links and keyboard navigation work.
4. `node scripts/verify-site.mjs` passes.
5. Any production change has an explicit deploy and rollback note.
