#!/bin/sh
# restore-backup.sh — restore databases + volumes on the VPS (run inside /opt/taysir).
# Idempotent: skips each restore step when the target already has data, so
# re-deploying over a live stack is a safe no-op.
# Usage: ./scripts/restore-backup.sh [BACKUP_DIR] [FORCE]
set -e

BACKUP_DIR="${1:-2026-09-14}"
FORCE="${2:-}"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Backup dir: $BACKUP_DIR"

# Only the two data services are needed for the restore
$COMPOSE up -d postgres redis

echo "==> Waiting for postgres to be healthy ..."
timeout 90 $COMPOSE exec -T postgres sh -c 'until pg_isready -U academy_user -d academy_db; do sleep 2; done'

# Ensure the app database exists (the initdb script only runs on an empty volume)
echo "==> Ensuring academy_app database exists ..."
$COMPOSE exec -T postgres sh -c \
  "psql -U academy_user -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='academy_app'\" | grep -q 1 || \
   psql -U academy_user -d postgres -c 'CREATE DATABASE academy_app OWNER academy_user'"

app_rows=$($COMPOSE exec -T postgres psql -U academy_user -d academy_app -tAc "SELECT count(*) FROM \"User\"" 2>/dev/null || echo "0")
evo_rows=$($COMPOSE exec -T postgres psql -U academy_user -d academy_db -tAc "SELECT count(*) FROM \"Instance\"" 2>/dev/null || echo "0")

echo "==> Existing rows: app users=$app_rows, evolution instances=$evo_rows"

if [ -n "$FORCE" ]; then
  echo "==> FORCE mode: restoring even though data exists ..."
fi

if [ "$app_rows" = "0" ] || [ -n "$FORCE" ]; then
  echo "==> Restoring app database (academy_app) ..."
  gunzip -c "$BACKUP_DIR/native-postgres.sql.gz" | $COMPOSE exec -T postgres pg_restore -U academy_user -d academy_app -Fc --no-owner --no-privileges || {
    echo "   (pg_restore warnings ignored — schema usually already present)"
  }
else
  echo "==> Skipping app database restore (academy_app already has data)"
fi

if [ "$evo_rows" = "0" ] || [ -n "$FORCE" ]; then
  echo "==> Restoring Evolution database (academy_db) ..."
  gunzip -c "$BACKUP_DIR/docker-postgres.sql.gz" | $COMPOSE exec -T postgres pg_restore -U academy_user -d academy_db -Fc --no-owner --no-privileges || {
    echo "   (pg_restore warnings ignored — schema usually already present)"
  }
  echo "==> Restoring Evolution instances volume ..."
  docker run --rm \
    -v taysir_evolution_instances:/data \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    alpine sh -c "tar xzf /backup/volume-evolution_instances.tar.gz -C /data"
else
  echo "==> Skipping Evolution restore (academy_db already has instances)"
fi

if [ "$app_rows" = "0" ] || [ "$evo_rows" = "0" ] || [ -n "$FORCE" ]; then
  echo "==> Restoring Redis volume ..."
  docker run --rm \
    -v taysir_redis_data:/data \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    alpine sh -c "cd /data && tar xzf /backup/redis-backup.tar.gz"
else
  echo "==> Skipping Redis volume restore (already populated)"
fi

echo "==> Verifying row counts ..."
echo -n "   app users:  "; $COMPOSE exec -T postgres psql -U academy_user -d academy_app -tAc "SELECT count(*) FROM \"User\""
echo -n "   app sessions: "; $COMPOSE exec -T postgres psql -U academy_user -d academy_app -tAc "SELECT count(*) FROM \"Session\""
echo -n "   evolution instances: "; $COMPOSE exec -T postgres psql -U academy_user -d academy_db -tAc "SELECT count(*) FROM \"Instance\""

echo "==> Backup restore complete."