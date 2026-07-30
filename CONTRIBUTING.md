# Contributing to Panor Sound

This public repository publishes the independent Panor product at `https://www.panor.tech/sound/`. It must never modify or reuse the separate `/soundscape/` product.

## Before You Start

Read these files in order:

1. `AGENTS.md` — project rules and architecture.
2. `docs/CONTENT_BRIEF.md` — owner-approved product decisions.
3. `docs/DEVELOPER_HANDOFF.md` — implementation checklist.
4. `docs/DEPLOYMENT.md` — CI/CD, rollback, and production behavior.
5. `docs/SECURITY.md` — secrets and integration boundaries.

Do not invent product claims, CTA destinations, legal text, integrations, analytics, forms, or product capabilities. Unresolved decisions stay as draft placeholders and must not be marked production-ready.

## Local Setup

```bash
git clone https://github.com/chengyixu/panor-sound.git
cd panor-sound
git switch -c feat/<short-description>
python3 -m http.server 4173
```

Open `http://localhost:4173/`. The local site runs at `/`; production runs at `/sound/`.

## Source-of-Truth Files

- `site.config.js` — visible copy, links, navigation, sections, and `publish.ready`.
- `index.html` — SEO metadata, structured data, Monetag, cross-promotion, and semantic shell.
- `assets/` — presentation and safe DOM rendering.
- `panor/product.json` — homepage, cross-promo, sitemap, `llms.txt`, and FAQ registration metadata.
- `docs/CONTENT_BRIEF.md` — dated owner decisions and approval record.

The approved Monetag integration is:

```html
<script src="https://quge5.com/88/tag.min.js" data-zone="264769" async data-cfasync="false"></script>
```

AdSense is not allowed. Keep `<script src="/public/cross-promo.js" defer></script>` in the production page.

## Required Checks

Run these before opening a pull request:

```bash
node scripts/verify-site.mjs
node scripts/test-panor-registry.mjs
```

If the PR changes `index.html`, `site.config.js`, or `assets/`, it is a production release candidate and must also pass:

```bash
node scripts/verify-site.mjs --production
```

The production check requires approved non-placeholder content, `publish.ready: true`, canonical and social metadata, structured data, a 150–300 word noscript fallback, Monetag, cross-promotion, no AdSense, and the fixed `/sound/` route contract.

Manually test:

- Narrow mobile and desktop layouts.
- Keyboard navigation and visible focus.
- Every CTA and external link.
- Image licensing and alt text.
- No active reference to `/soundscape/` in site assets.

## Pull Request Flow

1. Push a feature branch; never push product work directly to `main`.
2. Open a pull request and complete the repository PR template.
3. Wait for the required `verify` check.
4. Resolve review comments and conversations.
5. Obtain owner/code-owner approval.
6. Merge using squash or rebase; do not force-push `main`.

Documentation-only and deployment-tooling PRs run CI but do not publish the site. A merged PR that changes `index.html`, `site.config.js`, or `assets/` automatically starts the production workflow.

## What Happens After Merge

`.github/workflows/deploy-production.yml`:

1. Confirms the commit belongs to a PR merged into `main`.
2. Re-runs production policy and Panor registry tests.
3. Uses the GitHub `production` environment and a dedicated non-root SSH identity.
4. Backs up and atomically updates `/sound/`.
5. Registers the product in homepage data, ItemList/FAQ JSON-LD, featured products, cross-promo, sitemap, and `llms.txt`.
6. Verifies the live page, assets, security headers, registration endpoints, and `/soundscape/` isolation.
7. Rolls back automatically if launch or isolation checks fail.
8. Submits the `/sound/` URL through IndexNow after a successful release.

Watch the `Deploy production` Actions run until it completes. Do not run `deploy/publish-static.sh --apply` for a normal release; it exists only for owner-controlled emergency recovery.

Google Search Console sitemap submission is a one-time launch-owner follow-up because personal browser OAuth credentials are intentionally not exported to GitHub Actions.

## Secrets and Incidents

Never commit SSH keys, tokens, `.env` files, production host details, customer data, or private media. Do not paste secrets into PRs, issues, logs, screenshots, or Actions output.

If CI or deployment fails, do not retry by bypassing checks or manually copying files. Read the failed Actions step; the release helper restores the previous site after failed smoke checks. Escalate suspected credential exposure privately to the repository owner.
