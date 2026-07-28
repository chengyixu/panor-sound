---
name: marketing-site-verify
description: Verify the Sound static marketing site before review or release.
---

# Marketing Site Verification

Use after any site, configuration, routing, or deployment-template change.

## Checks

```bash
node scripts/verify-site.mjs
```

For a release candidate with owner-approved content:

```bash
node scripts/verify-site.mjs --production
```

## Manual Review

1. Serve locally: `python3 -m http.server 4173`.
2. Check the page at a narrow mobile viewport and desktop viewport.
3. Use keyboard-only navigation; focus must remain visible.
4. Verify every configured link and CTA destination.
5. Confirm no unapproved claim, placeholder, or external integration exists.
6. After deployment, confirm `/sound/` works and the existing `/soundscape/` remains unchanged.

Do not “fix” a missing product decision with guessed content. Report the missing approval instead.
