---
name: marketing-site-verify
description: Verify the live Sound consumer before review or release.
---

# Marketing Site Verification

Use after any site, configuration, routing, or deployment-template change.

## Checks

```bash
npm run verify
```

For a release candidate with owner-approved content:

```bash
node scripts/verify-site.mjs --production
npm run test:production
```

## Manual Review

1. Serve locally: `python3 -m http.server 4173`.
2. Check the page at a narrow mobile viewport and desktop viewport.
3. Use keyboard-only navigation; focus must remain visible.
4. Verify every configured link and CTA destination.
5. Confirm both live APIs are requested and no test/demo record appears.
6. Confirm marker geometry, map tiles, audio URL, and play telemetry behavior.
7. After deployment, confirm `/sound/` matches its captured API responses and `/soundscape/` remains unchanged.

Do not “fix” a missing product decision with guessed content. Report the missing approval instead.
