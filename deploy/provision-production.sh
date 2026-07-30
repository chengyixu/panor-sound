#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${SOUND_DEPLOY_TARGET:-}"
public_key_file="${SOUND_DEPLOY_PUBLIC_KEY:-}"

if [[ -z "$target" || -z "$public_key_file" || ! -f "$public_key_file" ]]; then
  echo "Usage: SOUND_DEPLOY_TARGET=<root-ssh-target> SOUND_DEPLOY_PUBLIC_KEY=<public-key-file> ./deploy/provision-production.sh" >&2
  exit 2
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
SITE_BASE_PATH=/sound SITE_WEB_PARENT=/www/wwwroot/www.panor.tech \
  node "$repo_root/deploy/render-nginx-config.mjs" > "$work/panor-sound.conf"
cp "$repo_root/deploy/server/panor-sound-release" "$work/panor-sound-release"
cp "$public_key_file" "$work/deploy-key.pub"

scp -q "$work/panor-sound.conf" "$work/panor-sound-release" "$work/deploy-key.pub" "$target:/tmp/"
ssh -o ClearAllForwardings=yes "$target" 'bash -s' <<'REMOTE'
set -euo pipefail

deploy_user=panor-sound-deploy
vhost=/etc/nginx/conf.d/panor-sites/html_www.panor.tech.conf
snippet=/etc/nginx/snippets/panor-sound.conf
date_stamp="$(date +%Y%m%d)"

if ! id "$deploy_user" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /var/lib/panor-sound-deploy --shell /bin/bash "$deploy_user"
fi
install -d -o "$deploy_user" -g "$deploy_user" -m 0700 /var/lib/panor-sound-deploy/.ssh
install -d -o "$deploy_user" -g "$deploy_user" -m 0750 /var/lib/panor-sound-deploy/incoming
touch /var/lib/panor-sound-deploy/.ssh/authorized_keys
chown "$deploy_user:$deploy_user" /var/lib/panor-sound-deploy/.ssh/authorized_keys
chmod 0600 /var/lib/panor-sound-deploy/.ssh/authorized_keys

public_key="$(cat /tmp/deploy-key.pub)"
restricted_key="restrict ${public_key}"
if ! grep -Fqx "$restricted_key" /var/lib/panor-sound-deploy/.ssh/authorized_keys; then
  printf '%s\n' "$restricted_key" >> /var/lib/panor-sound-deploy/.ssh/authorized_keys
fi

install -o root -g root -m 0755 /tmp/panor-sound-release /usr/local/sbin/panor-sound-release
cat > /etc/sudoers.d/panor-sound-deploy <<'EOF'
panor-sound-deploy ALL=(root) NOPASSWD: /usr/local/sbin/panor-sound-release *
EOF
chmod 0440 /etc/sudoers.d/panor-sound-deploy
visudo -cf /etc/sudoers.d/panor-sound-deploy

if [[ -f "$snippet" ]]; then cp -a "$snippet" "$snippet.bak.$date_stamp"; fi
install -o root -g root -m 0644 /tmp/panor-sound.conf "$snippet"

if ! grep -Fq 'include /etc/nginx/snippets/panor-sound.conf;' "$vhost"; then
  cp -a "$vhost" "$vhost.bak.$date_stamp.cicd"
  python3 - "$vhost" <<'PY'
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
source = path.read_text()
marker = '    include /etc/nginx/snippets/panor-runtime-health.conf;'
addition = '    include /etc/nginx/snippets/panor-sound.conf;\n'
if marker not in source:
    raise SystemExit('cannot find safe Nginx include marker')
path.write_text(source.replace(marker, addition + marker, 1))
PY
fi

if ! nginx -t; then
  backup="$vhost.bak.$date_stamp.cicd"
  [[ -f "$backup" ]] && cp -a "$backup" "$vhost"
  exit 1
fi
systemctl reload nginx
rm -f /tmp/panor-sound.conf /tmp/panor-sound-release /tmp/deploy-key.pub
echo "Provisioned Panor Sound CI/CD deployment account and /sound/ route"
REMOTE
