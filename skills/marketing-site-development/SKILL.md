---
name: marketing-site-development
description: Build or revise the live /sound/ consumer without copying backend records or modifying /soundscape/.
---

# Marketing Site Development

Use for content, layout, navigation, responsive styling, accessibility, and approved media changes.

## Required Context

1. Read `AGENTS.md`.
2. Read `docs/CONTENT_BRIEF.md`.
3. Read `site.config.js`.
4. Read `CONTEXT.md` and the sector card for each source directory you touch.

## Rules

- Treat `site.config.js` as the source of presentation copy, links, limits, and API endpoint addresses.
- Keep all recording rows backend-owned; never add static featured, ranking, map, contributor, or statistics data.
- Use `textContent`, not HTML injection, for configured copy.
- Preserve the documented public feed, rankings, anonymous play, Leaflet, CARTO, Monetag, and cross-promotion contracts.
- Preserve the independent `/sound/` deployment; API calls and the app CTA may target `/soundscape/`, but deployment and auth code may not.
- Provide keyboard-accessible interactions and responsive layouts.

## Verification

```bash
npm run verify
```

Manually inspect a narrow mobile viewport and desktop viewport before handing off.
