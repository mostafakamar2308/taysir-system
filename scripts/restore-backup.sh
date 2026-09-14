#!/bin/sh
# restore-backup.sh — restore databases + volumes on the VPS (run inside /opt/taysir).
# Usage: ./scripts/restore-backup.sh [BACKUP_DIR]
set -e

BACKUP_DIR="${1:-2026-09-14}"
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

echo "==> Restoring Evolution database (academy_db) ..."
gunzip -c "$BACKUP_DIR/docker-postgres.sql.gz" | $COMPOSE exec -T postgres pg_restore -U academy_user -d academy_db -Fc --no-owner --no-privileges

echo "==> Restoring app database (academy_app) ..."
gunzip -c "$BACKUP_DIR/native-postgres.sql.gz" | $COMPOSE exec -T postgres pg_restore -U academy_user -d academy_app -Fc --no-owner --no-privileges

echo "==> Restoring Evolution instances volume ..."
docker run --rm \
  -v taysir_evolution_instances:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine sh -c "tar xzf /backup/volume-evolution_instances.tar.gz -C /data"

echo "==> Restoring Redis volume ..."
docker run --rm \
  -v taysir_redis_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine sh -c "cd /data && tar xzf /backup/redis-backup.tar.gz"

echo "==> Verifying row counts ..."
echo -n "   app users:  "; $COMPOSE exec -T postgres psql -U academy_user -d academy_app -tAc "SELECT count(*) FROM \"User\""
echo -n "   app sessions: "; $COMPOSE exec -T postgres psql -U academy_user -d academy_app -tAc "SELECT count(*) FROM \"Session\""
echo -n "   evolution instances: "; $COMPOSE exec -T postgres psql -U academy_user -d academy_db -tAc "SELECT count(*) FROM \"Instance\""

echo "==> Backup restore complete."