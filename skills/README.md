# Project Skills

These are portable, project-specific skills. They contain no credentials or machine-specific paths.

| Skill | Use it for |
|---|---|
| `marketing-site-development` | Config-driven content and accessible static-site changes |
| `marketing-site-verify` | Local, release, and regression verification |
| `marketing-site-deploy` | Owner-approved static release and rollback |

## Installation

From the repository root:

```bash
./scripts/install-agent-skills.sh --target claude
./scripts/install-agent-skills.sh --target codex
```

The script creates symlinks rather than copies, so updates to this repository are immediately available. Use `--help` or `--dest <skills-root>` when a local Claude Code or Codex installation uses a nonstandard skills directory.

Even without installation, an agent can read the relevant `SKILL.md` directly from this repository after reading `AGENTS.md`.
