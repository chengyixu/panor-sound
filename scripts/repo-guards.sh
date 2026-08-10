#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-}"
if [ -z "$ROOT" ]; then
  ROOT="$(git -C . rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

IS_GIT=0
git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 && IS_GIT=1
EXC=(
  ':(exclude)**/node_modules/**' ':(exclude)**/build/**' ':(exclude)**/dist/**'
  ':(exclude)**/vendor/**' ':(exclude)**/.git/**' ':(exclude)**/__pycache__/**'
)
GREP_EXCLUDES="--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist --exclude-dir=vendor --exclude-dir=__pycache__"

scan() {
  local expression="$1"
  shift
  if [ "$IS_GIT" = 1 ]; then
    if [ "$#" -gt 0 ]; then
      git -C "$ROOT" grep -nIE "$expression" -- "$@" "${EXC[@]}" 2>/dev/null
    else
      git -C "$ROOT" grep -nIE "$expression" -- . "${EXC[@]}" 2>/dev/null
    fi
  else
    # shellcheck disable=SC2086
    grep -rnIE $GREP_EXCLUDES "$expression" "$ROOT" 2>/dev/null
  fi
}

hard_failures=0
red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

hard_rule() {
  local name="$1" hint="$2" hits="$3"
  if [ -n "$hits" ]; then
    red "✗ HARD: $name"
    printf '%s\n' "$hits" | head -20 | sed 's/^/    /'
    echo "    → $hint"
    hard_failures=$((hard_failures + 1))
  else
    green "✓ $name"
  fi
}

hard_require() {
  local name="$1" hint="$2"
  shift 2
  if "$@"; then
    green "✓ $name"
  else
    red "✗ HARD: $name"
    echo "    → $hint"
    hard_failures=$((hard_failures + 1))
  fi
}

warn_rule() {
  local name="$1" hint="$2" hits="$3"
  local count
  count=$(printf '%s' "$hits" | grep -c . || true)
  if [ "$count" -gt 0 ]; then
    yellow "⚠ WARN: $name ($count)"
    printf '%s\n' "$hits" | head -10 | sed 's/^/    /'
    echo "    → $hint"
  fi
}

echo "── repo-guards ($(basename "$ROOT")) ─────────────────────────"

hard_rule "No merge-conflict markers" \
  "Resolve the conflict before committing." \
  "$(scan '^(<{7}|>{7}) ')"

hard_rule "No focused tests (.only / fdescribe / fit)" \
  "Remove the focus marker so the complete suite runs." \
  "$(scan '(^|[^A-Za-z0-9_$.])((describe|context|it|test)\.only|f(describe|it))[[:space:]]*\(' '*.js' '*.mjs')"

hard_rule "No leftover debugger statements" \
  "Remove the debugger breakpoint." \
  "$(scan '^[[:space:]]*debugger;[[:space:]]*$' '*.js' '*.mjs')"

deployable_sources=(
  "$ROOT/index.html"
  "$ROOT/site.config.js"
  "$ROOT/assets/main.js"
  "$ROOT/assets/application/bootstrap.js"
  "$ROOT/assets/infrastructure/soundscape-api.js"
  "$ROOT/assets/ui/live-page.js"
)

hard_rule "No stale snapshot or future-event copy" \
  "Visible recording data must come from the API; remove copied records and speculative events." \
  "$(grep -nEi 'KFC TEST|Mong Kok Footbridge|map-placeholder|Coming Soon|(^|[^A-Za-z])TBA([^A-Za-z]|$)|Editor.?s Picks|Hall of Fame' "${deployable_sources[@]}" 2>/dev/null || true)"

hard_rule "No copied backend rows in configuration" \
  "Keep only API endpoints and presentation copy in site.config.js." \
  "$(grep -nE '(^|[^A-Za-z0-9_])(audio_url|play_count|save_count|full_play_count|created_at|author_name)[[:space:]]*:' "$ROOT/site.config.js" 2>/dev/null || true)"

hard_rule "Domain layer has no browser or outer-layer dependency" \
  "Keep normalization and model rules deterministic and browser-free." \
  "$(grep -nE "(^|[^A-Za-z])(window|document|fetch)([^A-Za-z]|$)|from ['\"]\.\./(application|infrastructure|ui)/" "$ROOT/assets/domain"/*.js 2>/dev/null || true)"

hard_rule "Infrastructure does not depend on UI or application" \
  "Infrastructure may depend only on the domain contract." \
  "$(grep -nE "from ['\"]\.\./(application|ui)/" "$ROOT/assets/infrastructure"/*.js 2>/dev/null || true)"

required_files=(
  package.json package-lock.json
  assets/application/bootstrap.js assets/domain/soundscape.js
  assets/infrastructure/soundscape-api.js assets/ui/live-page.js
  test/contract/live-api-contract.test.mjs test/domain/live-model.test.mjs
  test/e2e/live-page.e2e.test.mjs test/e2e/production-live-page.e2e.test.mjs
  CONTEXT.md HOW-IT-WORKS.md docs/adr/0001-live-backend-contract.md
  bug-regression-catalog/catalog.yaml .sectormap.json
  assets/application/CLAUDE.md assets/domain/CLAUDE.md
  assets/infrastructure/CLAUDE.md assets/ui/CLAUDE.md test/CLAUDE.md
  .woodpecker/ci.yaml .woodpecker/ci-success-bridge.sh
)
for relative_path in "${required_files[@]}"; do
  hard_require "Required contract exists: $relative_path" \
    "Restore the required no-bugs-first artifact." \
    test -f "$ROOT/$relative_path"
done

hard_require "Canonical soundscape feed endpoint is configured" \
  "Use /soundscape/api/soundscapes?scope=explore." \
  grep -Eq "soundscapesEndpoint:[[:space:]]*['\"]\/soundscape\/api\/soundscapes\?scope=explore['\"]" "$ROOT/site.config.js"

hard_require "Canonical rankings endpoint is configured" \
  "Use /soundscape/api/rankings." \
  grep -Eq "rankingsEndpoint:[[:space:]]*['\"]\/soundscape\/api\/rankings['\"]" "$ROOT/site.config.js"

hard_require "Browser contract requests both live APIs" \
  "Keep the API request assertions in the Playwright contract." \
  grep -Eq "apiRequests\.sort\(\).*rankings.*soundscapes|deepEqual\(apiRequests\.sort" "$ROOT/test/e2e/live-page.e2e.test.mjs"

hard_require "GitHub aggregate check is exact" \
  "Keep one aggregate job named exactly ci-success." \
  grep -Eq '^[[:space:]]+name:[[:space:]]+ci-success$' "$ROOT/.github/workflows/verify.yml"

hard_require "Woodpecker aggregate step is exact" \
  "Keep one Woodpecker step named exactly ci-success." \
  grep -Eq '^[[:space:]]+ci-success:$' "$ROOT/.woodpecker/ci.yaml"

hard_require "Sector map profile resolves declared source roots" \
  "Fix .sectormap.json so every declared sector root is a real directory." \
  node -e 'const fs=require("fs"),path=require("path"); const root=process.argv[1]; const p=JSON.parse(fs.readFileSync(path.join(root,".sectormap.json"),"utf8")); if(!p.label||!p.lang||!Array.isArray(p.sectors)||!p.sectors.length)process.exit(1); for(const s of p.sectors){if(!fs.statSync(path.join(root,p.src_base||"",s.root)).isDirectory())process.exit(1)}' "$ROOT"

warn_rule "Empty catch blocks" \
  "Log or rethrow unexpected failures; document intentionally ignored cases." \
  "$(scan 'catch[[:space:]]*\([^)]*\)[[:space:]]*\{[[:space:]]*\}')"

warn_rule "Skipped tests" \
  "Every skip needs a tracked removal condition." \
  "$(scan '(\.skip[[:space:]]*\(|(^|[^A-Za-z0-9_$.])x(it|describe)[[:space:]]*\()')"

echo "────────────────────────────────────────────────────────────"
if [ "$hard_failures" -gt 0 ]; then
  red "repo-guards FAILED: $hard_failures hard rule(s) violated."
  exit 1
fi
green "repo-guards passed (hard rules clean)."
