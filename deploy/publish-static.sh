#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Publish this static site to an owner-provisioned SSH destination.

Usage:
  SOUND_SITE_BASE_PATH=/sound \
  SOUND_DEPLOY_TARGET=<ssh-target> \
  SOUND_WEB_PARENT=/absolute/web/root \
  ./deploy/publish-static.sh --dry-run|--apply

--dry-run validates the release and prints the target directory.
--apply uploads only index.html, site.config.js, and assets/ to:
  $SOUND_WEB_PARENT/${SOUND_SITE_BASE_PATH#/}

No host or filesystem path is stored in the repository. --apply requires a clean
working tree, production-ready content, explicit operator confirmation, and the
environment variable SOUND_DEPLOY_APPROVED=yes.
EOF
}

mode="${1:-}"
if [[ "$mode" != "--dry-run" && "$mode" != "--apply" ]]; then
  usage >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

required() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 2
  fi
}

required SOUND_SITE_BASE_PATH
required SOUND_DEPLOY_TARGET
required SOUND_WEB_PARENT

base_path="$SOUND_SITE_BASE_PATH"
if [[ ! "$base_path" =~ ^/[A-Za-z0-9][A-Za-z0-9/-]*$ || "$base_path" == */ || "$base_path" == *//* ]]; then
  echo "SOUND_SITE_BASE_PATH must be a slash-prefixed path without a trailing slash" >&2
  exit 2
fi
if [[ ! "$SOUND_WEB_PARENT" =~ ^/[A-Za-z0-9_./-]+$ || "$SOUND_WEB_PARENT" == *..* ]]; then
  echo "SOUND_WEB_PARENT must be a safe absolute path" >&2
  exit 2
fi

site_directory="${SOUND_WEB_PARENT%/}/${base_path#/}"
node scripts/verify-site.mjs

if [[ "$mode" == "--dry-run" ]]; then
  printf 'Validated release. Would publish static files to %s:%s\n' "$SOUND_DEPLOY_TARGET" "$site_directory"
  exit 0
fi

if [[ "${SOUND_DEPLOY_APPROVED:-}" != "yes" ]]; then
  echo "Set SOUND_DEPLOY_APPROVED=yes only after explicit production approval." >&2
  exit 2
fi
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Refusing production deployment from a dirty Git worktree." >&2
  exit 1
fi
node scripts/verify-site.mjs --production

tar -czf - index.html site.config.js assets | ssh "$SOUND_DEPLOY_TARGET" "
  set -eu
  destination='$site_directory'
  staging=\"\${destination}.staging-\$(date +%s)\"
  mkdir -p \"\$staging\"
  tar -xzf - -C \"\$staging\"
  rm -rf \"\${destination}.previous\"
  if [ -d \"\$destination\" ]; then mv \"\$destination\" \"\${destination}.previous\"; fi
  mv \"\$staging\" \"\$destination\"
"

printf 'Published static files to %s:%s\n' "$SOUND_DEPLOY_TARGET" "$site_directory"
if [[ -n "${SOUND_SITE_URL:-}" ]]; then
  curl --fail --silent --show-error --location "$SOUND_SITE_URL" >/dev/null
  printf 'Smoke check passed: %s\n' "$SOUND_SITE_URL"
fi
