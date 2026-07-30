# Deployment

## Scope

This is a static-site release procedure for `/sound/`. It does not deploy an application server, database, background worker, analytics service, or 3D renderer. It must not modify the existing `/soundscape/` site.

No server host, SSH alias, web-root path, or credential is committed to this repository. The infrastructure owner supplies them at release time.

## Release Policy

- A reviewed pull request merged into `main` is explicit production approval.
- Direct pushes to `main` fail the deployment provenance gate.
- Documentation, workflow, and deployment-tool changes do not publish the site by themselves.
- Changes to `index.html`, `site.config.js`, or `assets/` trigger the production deployment workflow.
- The workflow fails closed until `publish.ready: true`, approved content, required SEO, Monetag, cross-promotion, and `panor/product.json` all pass verification.

## Preconditions

- Owner-approved content brief and `publish.ready: true` in `site.config.js`.
- Clean Git worktree on the approved commit.
- The dedicated `panor-sound-deploy` SSH account and root-owned release helper are provisioned.
- An absolute static web-root parent supplied as `SOUND_WEB_PARENT`.
- Permission to update the relevant Nginx server block.
- A known rollback owner.

## One-Time Route Provisioning

Generate a dedicated Ed25519 key for GitHub Actions, then run the provisioning script as the infrastructure owner:

```bash
SOUND_DEPLOY_TARGET=<root-ssh-target> \
SOUND_DEPLOY_PUBLIC_KEY=<dedicated-public-key-file> \
  ./deploy/provision-production.sh
```

The script creates a restricted deployment account, installs the root-owned atomic release helper, adds an isolated `/sound/` Nginx snippet, backs up the vhost, runs `nginx -t`, and reloads only after validation succeeds.

Choose a static web-root parent. With `SITE_WEB_PARENT=/var/www/panor`, the publisher writes the website to `/var/www/panor/sound/`.

```bash
SITE_BASE_PATH=/sound SITE_WEB_PARENT=/var/www/panor \
  node deploy/render-nginx-config.mjs > /tmp/sound.nginx.conf
```

Review the rendered output. Include it inside the intended HTTPS `server` block; it creates only these routes:

- `/sound` → `/sound/`
- `/sound/*` → static files below the new site directory

Before reloading:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Verify the site shell at its owner-approved public URL. Do not redirect, remove, or edit `/soundscape/`.

## Automatic Release

The GitHub `production` environment contains:

- Secret `PANOR_DEPLOY_SSH_KEY`
- Secret `PANOR_DEPLOY_KNOWN_HOSTS`
- Variable `PANOR_DEPLOY_HOST`
- Variable `PANOR_DEPLOY_PORT`
- Variable `PANOR_DEPLOY_USER`

After merge, `.github/workflows/deploy-production.yml` verifies merged-PR provenance, production policy, and registry update behavior; packages only approved files; deploys atomically; confirms all Panor registrations; verifies `/soundscape/` is unchanged; submits IndexNow; and rolls back automatically if launch smoke checks fail.

## Manual Recovery Release

First validate without uploading:

```bash
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/var/www/panor \
  ./deploy/publish-static.sh --dry-run
```

For emergency operator-controlled recovery only:

```bash
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/var/www/panor \
SOUND_DEPLOY_APPROVED=yes \
SOUND_SITE_URL=https://www.panor.tech/sound/ \
  ./deploy/publish-static.sh --apply
```

The manual publisher uploads only `index.html`, `site.config.js`, and `assets/`. Normal releases use the CI/CD release helper because it also updates Panor registration files and preserves rollback state.

## Post-Release Checks

1. Load `https://www.panor.tech/sound/`.
2. Confirm direct navigation to an asset succeeds.
3. Confirm browser back/refresh behavior is correct.
4. Test mobile and desktop layouts, keyboard navigation, and every approved CTA.
5. Confirm `https://www.panor.tech/soundscape/` remains unchanged.

## Rollback

On the server, replace the current `/sound` directory with its sibling `.previous` directory, then test the same public URL. Do not delete the previous release until the owner confirms the incident is closed.

The GitHub Actions run records the commit SHA, failure stage, and rollback result. Server backups live under `/var/backups/panor-sound/`; homepage `index.html` and `sitemap.xml` also receive adjacent `.bak.<YYYYMMDD>.<sha>` copies before mutation.
