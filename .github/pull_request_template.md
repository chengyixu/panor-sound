## Summary

<!-- What changed and why? Link the approved content decision when applicable. -->

## Validation

- [ ] `node scripts/verify-site.mjs`
- [ ] `node scripts/test-panor-registry.mjs`
- [ ] `node scripts/verify-site.mjs --production` if site release files changed
- [ ] Mobile and desktop layouts tested
- [ ] Keyboard navigation, focus states, CTAs, and links tested

## Panor Release Checklist

- [ ] Visible claims and CTA destinations are owner-approved
- [ ] `docs/CONTENT_BRIEF.md` records the approved decisions
- [ ] `site.config.js` remains the visible-copy source of truth
- [ ] `panor/product.json` matches the approved name and descriptions
- [ ] Full SEO, JSON-LD, canonical, OG, Twitter, and noscript content are present
- [ ] Monetag zone `264769` and `/public/cross-promo.js` are present
- [ ] No AdSense marker or credential is included
- [ ] `/soundscape/` is not modified or referenced by active site assets
- [ ] Rollback impact and any new integration/data flow are described

## Deployment

<!-- A merged PR changing index.html, site.config.js, or assets/ deploys automatically. Do not paste production credentials or run a manual production copy. -->
