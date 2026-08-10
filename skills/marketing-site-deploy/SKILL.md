---
name: marketing-site-deploy
description: Safely publish this repository's approved static marketing site at /sound/ without modifying other Panor routes.
---

# Marketing Site Deployment

Use only after explicit production approval from the release owner.

## Preconditions

- Read `AGENTS.md` and `docs/DEPLOYMENT.md`.
- `npm run verify` passes from a clean install.
- The Git worktree is clean and points at the approved commit.
- The operator provides `SOUND_DEPLOY_TARGET`, `SOUND_WEB_PARENT`, and `SOUND_SITE_BASE_PATH=/sound` outside Git.
- An Nginx configuration has been rendered, reviewed, and validated with `nginx -t`.

## Dry Run

```bash
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/absolute/web/root \
  ./deploy/publish-static.sh --dry-run
```

## Apply

```bash
SOUND_SITE_BASE_PATH=/sound \
SOUND_DEPLOY_TARGET=<ssh-target> \
SOUND_WEB_PARENT=/absolute/web/root \
SOUND_DEPLOY_APPROVED=yes \
SOUND_SITE_URL=https://www.panor.tech/sound/ \
  ./deploy/publish-static.sh --apply
```

## Verify and Roll Back

Verify the public URL, assets, live API requests, rendered titles/totals/markers, audio player, keyboard navigation, mobile layout, and route isolation. Run `npm run test:production`. If the release is wrong, restore the target directory’s `.previous` sibling as described in `docs/DEPLOYMENT.md`.
