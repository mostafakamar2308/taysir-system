#!/bin/bash
# ssl.sh — obtain a real Let's Encrypt certificate and enable HTTPS on nginx.
# Run on the VPS inside /opt/taysir. DNS must point to the VPS.
# Usage:  ./scripts/ssl.sh [DOMAIN]
set -euo pipefail

# Load deployment targets from the gitignored .env (DOMAIN/BASE_DOMAIN)
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a

DOMAIN="${1:-$DOMAIN}"
: "${DOMAIN:?DOMAIN not set — add it to .env or pass as \$1}"
BASE_DOMAIN="${BASE_DOMAIN:-${DOMAIN#www.}}"
WEBROOT="$PWD/certbot/www"
LE_LINEAGE="/etc/letsencrypt/live/$DOMAIN-0001"

mkdir -p "$WEBROOT"

# 1. Self-signed fallback so nginx 443 keeps working (harmless, replaced by certbot)
if [ ! -f "$LE_LINEAGE/fullchain.pem" ] && [ ! -f "/etc/letsencrypt/renewal/${DOMAIN}-0001.conf" ]; then
  echo "==> Creating temporary self-signed cert at $LE_LINEAGE ..."
  mkdir -p "$LE_LINEAGE"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$LE_LINEAGE/privkey.pem" \
    -out    "$LE_LINEAGE/fullchain.pem" \
    -subj   "/CN=$DOMAIN"
else
  echo "==> Real cert already exists at $LE_LINEAGE, skipping self-signed."
fi

echo "==> Installing certbot ..."
command -v certbot >/dev/null 2>&1 || sh -c 'apt-get update -qq && apt-get install -y -qq certbot'

echo "==> Requesting real certificate for $DOMAIN + $BASE_DOMAIN (webroot HTTP-01) ..."
certbot certonly \
  --webroot -w "$WEBROOT" \
  -d "$DOMAIN" \
  -d "$BASE_DOMAIN" \
  --non-interactive --agree-tos --register-unsafely-without-email \
  --keep-until-expiring

chown -R root:root "$WEBROOT" 2>/dev/null || true
chmod -R 755 "$WEBROOT" 2>/dev/null || true

echo "==> Reloading nginx with the real certificate ..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || \
  docker compose -f docker-compose.prod.yml restart nginx

echo "✅ HTTPS ready for https://$DOMAIN"
echo "   Test: curl -I https://$DOMAIN"
echo "   Renewal runs automatically via the certbot timer (webroot -w $WEBROOT)"
