# Deployment

## Scope

This is a static-site release procedure for `/sound/`. It does not deploy an application server, database, background worker, analytics service, or 3D renderer. It must not modify the existing `/soundscape/` site.

No server host, SSH alias, web-root path, or credential is committed to this repository. The infrastructure owner supplies them at release time.

## Preconditions

- Owner-approved content brief and `publish.ready: true` in `site.config.js`.
- Clean Git worktree on the approved commit.
- SSH access to the owner-provisioned host.
- An absolute static web-root parent supplied as `SOUND_WEB_PARENT`.
- Permission to update the relevant Nginx server block.
- A known rollback owner.

## One-Time Route Provisioning

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

## Release

First validate without uploading:

```bash
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/var/www/panor \
  ./deploy/publish-static.sh --dry-run
```

After explicit production approval:

```bash
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/var/www/panor \
SOUND_DEPLOY_APPROVED=yes \
SOUND_SITE_URL=https://www.panor.tech/sound/ \
  ./deploy/publish-static.sh --apply
```

The publisher uploads only `index.html`, `site.config.js`, and `assets/`. It swaps the target directory and keeps the immediately preceding directory as `<target>.previous` for rollback.

## Post-Release Checks

1. Load `https://www.panor.tech/sound/`.
2. Confirm direct navigation to an asset succeeds.
3. Confirm browser back/refresh behavior is correct.
4. Test mobile and desktop layouts, keyboard navigation, and every approved CTA.
5. Confirm `https://www.panor.tech/soundscape/` remains unchanged.

## Rollback

On the server, replace the current `/sound` directory with its sibling `.previous` directory, then test the same public URL. Do not delete the previous release until the owner confirms the incident is closed.

Record the failure, commit SHA, decision owner, and recovery time in the release record or issue tracker.
