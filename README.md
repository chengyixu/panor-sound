# Sound

Neutral, static marketing-site scaffold for the independent production path **`/sound/`**.

It is intentionally not a copy of the existing `/soundscape/` product. This repository has no assumed backend, 3D experience, database, analytics vendor, CMS, or product claims. A developer can turn it into the approved page after the owner supplies the content brief.

## What You Get

- A dependency-free responsive site shell.
- A single, reviewable content configuration: `site.config.js`.
- Root instructions for both Codex and Claude Code: `AGENTS.md` and `CLAUDE.md`.
- Project-specific skills for development, verification, and safe deployment.
- A generic Nginx configuration template and an opt-in static deployment script.
- GitHub Actions verification with no deployment credentials.

## Start Here

```bash
git clone <repository-url>
cd sound

# Read the project contract before changing anything.
cat AGENTS.md

# Serve the static files locally.
python3 -m http.server 4173

# In another terminal, verify the scaffold.
node scripts/verify-site.mjs
```

Open `http://localhost:4173/`. Local development works from `/`; the production reverse-proxy contract is `/sound/`.

## Owner Decisions Needed Before Publication

No developer or agent should infer these decisions. Record approved answers in `docs/CONTENT_BRIEF.md`, then update `site.config.js`:

1. Product name, audience, value proposition, and approved claims.
2. Primary and secondary CTA labels and destinations.
3. Page sections, imagery, tone, locales, and legal/privacy links.
4. Whether a contact form, analytics, tracking consent, or any integration is wanted.
5. Production host access, static web-root parent, and release owner.

`node scripts/verify-site.mjs --production` deliberately fails while the configuration remains in draft mode.

## Project Layout

```text
AGENTS.md                    Shared Codex / Claude Code instructions
CLAUDE.md                    Symlink to AGENTS.md
index.html                   Semantic page shell
site.config.js               All approved marketing content and links
assets/                      Renderer and responsive styles
docs/                        Content, developer handoff, security, deployment docs
deploy/                      Nginx template and renderer
scripts/                     Verification, deployment, skills installer
skills/                      Portable project skills
.github/workflows/verify.yml GitHub CI verification
```

## Working With an Agent

For Codex or Claude Code, paste the repository URL and begin with:

> Read `AGENTS.md`, `docs/DEVELOPER_HANDOFF.md`, and `docs/CONTENT_BRIEF.md`. Do not infer product features or claims. Tell me which owner decisions are still required before implementing the marketing page.

`CLAUDE.md` points to `AGENTS.md`, and Codex reads `AGENTS.md` in the repository tree. Install the optional task skills with:

```bash
./scripts/install-agent-skills.sh --target claude
./scripts/install-agent-skills.sh --target codex
```

Use `--help` to specify another skill directory. The repository itself remains portable even if a local agent runtime uses a different skill root.

## Configuration

`site.config.js` is the source of truth for visible content. Keep it in `draft` mode until the owner approves all required copy and links.

```js
publish: { ready: false }
```

When approved, set `ready` to `true`, replace all placeholders, and run:

```bash
node scripts/verify-site.mjs --production
```

## Deployment

The website is designed for an Nginx-hosted static directory at `/sound/`. Production credentials are stored only in the GitHub `production` environment.

```bash
# Render a snippet for the owner-provisioned Nginx server.
SITE_BASE_PATH=/sound SITE_WEB_PARENT=/absolute/web/root \
  node deploy/render-nginx-config.mjs > sound.nginx.conf

# Validate the planned release without touching a server.
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/absolute/web/root \
  ./deploy/publish-static.sh --dry-run
```

Pull requests run structural checks. Any PR that changes `index.html`, `site.config.js`, or `assets/` must also pass the production-readiness policy, including approved content, full Panor SEO, Monetag-only monetization, and registration metadata. A reviewed merge into `main` is the production approval signal and automatically deploys the release. Direct pushes do not deploy because the workflow requires an associated merged PR. Follow `docs/DEPLOYMENT.md` for provisioning and rollback details. This repository never alters `/soundscape/`.

## Validation

```bash
node scripts/verify-site.mjs
```

The check confirms the required static files, the `/sound/` production configuration, configuration-driven rendering, no legacy `/soundscape/` route, and a valid Nginx template. Release changes additionally run `node scripts/verify-site.mjs --production`, the Panor registry idempotency test, and post-deployment smoke checks.

## Handoff

- Developer workflow: `docs/DEVELOPER_HANDOFF.md`
- Content decision template: `docs/CONTENT_BRIEF.md`
- Production release / rollback: `docs/DEPLOYMENT.md`
- Security handling: `docs/SECURITY.md`
- Agent skills: `skills/README.md`
