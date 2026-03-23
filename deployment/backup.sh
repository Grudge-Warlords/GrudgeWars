#!/usr/bin/env bash
# ============================================
# Grudge Studio — Automated PostgreSQL Backup
# Run via cron: 0 3 * * * /path/to/backup.sh
# ============================================
set -euo pipefail

# ── Config ──────────────────────────────────
CONTAINER_NAME="grudge-postgres"
BACKUP_DIR="/opt/grudge/backups"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="grudge_${TIMESTAMP}.sql.gz"

# Discord webhook for notifications (set in env or leave empty to skip)
DISCORD_WEBHOOK_URL="${DISCORD_BACKUP_WEBHOOK:-}"

# ── Functions ───────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

notify_discord() {
  local message="$1"
  local color="${2:-3447003}"  # default blue
  if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    curl -s -o /dev/null -X POST "$DISCORD_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"embeds\":[{\"title\":\"🗄️ Grudge DB Backup\",\"description\":\"${message}\",\"color\":${color},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}"
  fi
}

# ── Preflight ───────────────────────────────
mkdir -p "$BACKUP_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log "ERROR: Container '${CONTAINER_NAME}' is not running!"
  notify_discord "❌ Backup FAILED — container not running" "15158332"
  exit 1
fi

# ── Backup ──────────────────────────────────
log "Starting backup → ${BACKUP_FILE}"
docker exec "$CONTAINER_NAME" \
  pg_dumpall -U "$DB_USER" --clean --if-exists \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

FILESIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Backup complete: ${BACKUP_FILE} (${FILESIZE})"

# ── Verify ──────────────────────────────────
if [ ! -s "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  log "ERROR: Backup file is empty!"
  notify_discord "❌ Backup FAILED — file is empty" "15158332"
  exit 1
fi

# ── Cleanup old backups ────────────────────
DELETED=$(find "$BACKUP_DIR" -name "grudge_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
log "Cleaned up ${DELETED} old backup(s) (older than ${RETENTION_DAYS} days)"

# ── Report ──────────────────────────────────
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "grudge_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Backup dir: ${TOTAL_BACKUPS} files, ${TOTAL_SIZE} total"
notify_discord "✅ Backup succeeded\\n**File:** ${BACKUP_FILE}\\n**Size:** ${FILESIZE}\\n**Total backups:** ${TOTAL_BACKUPS} (${TOTAL_SIZE})\\n**Cleaned:** ${DELETED} old files" "3066993"

log "Done."
