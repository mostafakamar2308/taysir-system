#!/bin/bash
# deploy.sh — push the project to the VPS, restore backups, build & run.
#
# Usage:  ./scripts/deploy.sh [VPS_HOST]
#         VPS_HOST defaults to the value in .env (never hardcoded in git).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load deployment targets from the gitignored .env
set -a
# shellcheck disable=SC1091
. "$REPO_DIR/.env"
set +a

VPS_HOST="${1:-$VPS_HOST}"
: "${VPS_HOST:?VPS_HOST not set — add it to .env or pass as \$1 (e.g. root@1.2.3.4)}"
DOMAIN="${DOMAIN:?DOMAIN not set — add it to .env}"
BASE_DOMAIN="${BASE_DOMAIN:-${DOMAIN#www.}}"

REMOTE_DIR="/opt/taysir"
BACKUP_TAR="uploads/student-reports/taysir-backup-2026-09-14.tar.gz"

echo "==> Preparing remote dir ..."
ssh "$VPS_HOST" "mkdir -p $REMOTE_DIR/uploads/student-reports $REMOTE_DIR/certbot/www"

echo "==> Syncing project to $VPS_HOST:$REMOTE_DIR ..."
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'generated' \
  --exclude 'exports' \
  --exclude 'remotion' \
  --exclude 'agents' \
  --exclude 'tests' \
  --exclude '.git' \
  --exclude '.vscode' \
  --exclude 'uploads' \
  --exclude 'certbot' \
  --exclude '2026-09-14' \
  "$REPO_DIR"/ "$VPS_HOST:$REMOTE_DIR"/

echo "==> Uploading backup archive ..."
scp "$REPO_DIR/$BACKUP_TAR" "$VPS_HOST:$REMOTE_DIR/uploads/student-reports/"

echo "==> Rendering nginx configs from templates ..."
ssh "$VPS_HOST" "cd $REMOTE_DIR && sed -e 's|__DOMAIN__|$DOMAIN|g' -e 's|__BASE_DOMAIN__|$BASE_DOMAIN|g' nginx/templates/01-http.conf.template > nginx/conf.d/01-http.conf && sed -e 's|__DOMAIN__|$DOMAIN|g' -e 's|__BASE_DOMAIN__|$BASE_DOMAIN|g' nginx/templates/02-https.conf.template > nginx/conf.d/02-https.conf"

echo "==> Ensuring Docker is installed on the VPS ..."
ssh "$VPS_HOST" 'bash -s' <<'REMOTE'
set -e
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker via get.docker.com ..."
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true
if ! docker compose version >/dev/null 2>&1; then
  echo "Installing docker compose plugin ..."
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin
fi
docker compose version
REMOTE

echo "==> Extracting backup archive on VPS ..."
ssh "$VPS_HOST" "cd $REMOTE_DIR && tar -xzf uploads/student-reports/taysir-backup-2026-09-14.tar.gz"

echo "==> Restoring databases & volumes ..."
ssh "$VPS_HOST" "cd $REMOTE_DIR && chmod +x scripts/restore-backup.sh && ./scripts/restore-backup.sh"

echo "==> Ensuring nginx can boot (temporary self-signed cert at the certbot lineage path) ..."
ssh "$VPS_HOST" "mkdir -p /etc/letsencrypt/live/$DOMAIN-0001 && \
  { [ -f /etc/letsencrypt/live/$DOMAIN-0001/fullchain.pem ] || \
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
      -keyout /etc/letsencrypt/live/$DOMAIN-0001/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN-0001/fullchain.pem \
      -subj '/CN=$DOMAIN'; }"

echo "==> Building images and starting all services (this takes several minutes) ..."
ssh "$VPS_HOST" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml up -d --build"

echo "==> Health status ..."
ssh "$VPS_HOST" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml ps"

echo ""
echo "✅ Deploy complete."
echo "   Check locally:  curl -I https://$DOMAIN"
echo "   App logs:       ssh $VPS_HOST 'docker compose -f $REMOTE_DIR/docker-compose.prod.yml logs -f app'"
echo ""
echo "   ⚠️  To install the real Let's Encrypt certificate run on the VPS:"
echo "      cd $REMOTE_DIR && ./scripts/ssl.sh $DOMAIN"