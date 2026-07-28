#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Install this repository's portable project skills as symlinks.

Usage:
  ./scripts/install-agent-skills.sh --target claude [--dest PATH]
  ./scripts/install-agent-skills.sh --target codex [--dest PATH]
  ./scripts/install-agent-skills.sh --target both [--dest PATH]

Defaults:
  Claude Code: ${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}
  Codex:       ${CODEX_SKILLS_DIR:-${CODEX_HOME:-$HOME/.codex}/skills}

Use --dest when your installation has a custom skills root. Existing non-symlink
folders are never replaced.
EOF
}

target=""
destination=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) target="${2:-}"; shift 2 ;;
    --dest) destination="${2:-}"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$target" != "claude" && "$target" != "codex" && "$target" != "both" ]]; then
  echo "--target must be claude, codex, or both" >&2
  usage >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skills=(marketing-site-development marketing-site-deploy marketing-site-verify)

install_to() {
  local root="$1"
  mkdir -p "$root"
  for skill in "${skills[@]}"; do
    local source="$repo_root/skills/$skill"
    local link="$root/$skill"
    if [[ -e "$link" || -L "$link" ]]; then
      if [[ -L "$link" && "$(readlink "$link")" == "$source" ]]; then
        echo "already linked: $link"
        continue
      fi
      echo "refusing to replace existing path: $link" >&2
      exit 1
    fi
    ln -s "$source" "$link"
    echo "linked: $link -> $source"
  done
}

if [[ -n "$destination" && "$target" == "both" ]]; then
  echo "--dest can be used with one target only" >&2
  exit 2
fi

if [[ "$target" == "claude" || "$target" == "both" ]]; then
  install_to "${destination:-${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}}"
fi
if [[ "$target" == "codex" || "$target" == "both" ]]; then
  install_to "${destination:-${CODEX_SKILLS_DIR:-${CODEX_HOME:-$HOME/.codex}/skills}}"
fi
