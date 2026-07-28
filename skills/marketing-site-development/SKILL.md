---
name: marketing-site-development
description: Build or revise this repository's static marketing page without inventing product claims, integrations, or requirements.
---

# Marketing Site Development

Use for content, layout, navigation, responsive styling, accessibility, and approved media changes.

## Required Context

1. Read `AGENTS.md`.
2. Read `docs/CONTENT_BRIEF.md`.
3. Read `site.config.js`.
4. Stop and request owner decisions when the brief does not approve the needed claim, CTA, visual, or integration.

## Rules

- Treat `site.config.js` as the sole source of visible copy, links, and sections.
- Keep `index.html` semantic and `assets/main.js` free of hard-coded marketing claims.
- Use `textContent`, not HTML injection, for configured copy.
- Do not add product features, APIs, 3D, tracking, forms, cookies, external fonts, or third-party scripts without a documented approval.
- Preserve the independent `/sound/` route; never introduce `/soundscape/` into active site assets.
- Provide keyboard-accessible interactions and responsive layouts.

## Verification

```bash
node scripts/verify-site.mjs
python3 -m http.server 4173
```

Manually inspect a narrow mobile viewport and desktop viewport before handing off.
