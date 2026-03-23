#!/usr/bin/env bash
# ============================================
# Grudge Studio — Service Health Monitor
# Run via cron: */5 * * * * /path/to/monitor.sh
# ============================================
set -uo pipefail

# ── Config ──────────────────────────────────
DISCORD_WEBHOOK_URL="${DISCORD_MONITOR_WEBHOOK:-}"
TIMEOUT=10
STATE_DIR="/tmp/grudge-monitor"
mkdir -p "$STATE_DIR"

# ── Services to monitor ────────────────────
declare -A SERVICES=(
  ["Grudge Auth (SSO)"]="https://id.grudge-studio.com/health"
  ["Game API"]="https://api.grudge-studio.com/health"
  ["Grudge Warlords"]="https://grudgewarlords.com"
  ["Unity Dedicated Server"]="https://grudgewarlords.com/api/servers/unity/status"
  ["Account API"]="https://account.grudge-studio.com/health"
  ["Dashboard"]="https://dash.grudge-studio.com"
  ["Nexus Hub"]="https://grudachain-rho.vercel.app/api/health"
  ["GDevelop Assistant"]="https://gdevelop-assistant.vercel.app/api/health"
  ["Warlord Crafting Suite"]="https://warlord-crafting-suite.vercel.app"
  ["ObjectStore"]="https://molochdagod.github.io/ObjectStore"
  ["WebSocket"]="https://ws.grudge-studio.com/health"
  ["Asset Service"]="https://assets-api.grudge-studio.com/health"
)

# ── Functions ───────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

notify_discord() {
  local title="$1"
  local description="$2"
  local color="${3:-15158332}"  # default red
  if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    curl -s -o /dev/null -X POST "$DISCORD_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"embeds\":[{\"title\":\"${title}\",\"description\":\"${description}\",\"color\":${color},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}"
  fi
}

check_service() {
  local name="$1"
  local url="$2"
  local state_file="${STATE_DIR}/$(echo "$name" | tr ' ()' '___').state"

  local http_code
  local start_time=$SECONDS
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")
  local latency=$(( SECONDS - start_time ))

  local prev_state="unknown"
  [ -f "$state_file" ] && prev_state=$(cat "$state_file")

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
    # Service is UP
    echo "up" > "$state_file"
    if [ "$prev_state" = "down" ]; then
      log "RECOVERED: ${name} (HTTP ${http_code}, ${latency}s)"
      notify_discord "✅ ${name} — RECOVERED" "Service is back online (HTTP ${http_code}, latency ${latency}s)" "3066993"
    else
      log "OK: ${name} (HTTP ${http_code}, ${latency}s)"
    fi
  else
    # Service is DOWN
    echo "down" > "$state_file"
    if [ "$prev_state" != "down" ]; then
      # First failure — alert
      log "DOWN: ${name} (HTTP ${http_code}, ${latency}s)"
      notify_discord "🚨 ${name} — DOWN" "**URL:** ${url}\\n**Status:** HTTP ${http_code}\\n**Latency:** ${latency}s" "15158332"
    else
      # Already reported as down
      log "STILL DOWN: ${name} (HTTP ${http_code})"
    fi
  fi
}

# ── Run checks ─────────────────────────────
log "=== Grudge Studio Health Check ==="

FAILURES=0
for name in "${!SERVICES[@]}"; do
  check_service "$name" "${SERVICES[$name]}"
  # Count failures for summary
  state_file="${STATE_DIR}/$(echo "$name" | tr ' ()' '___').state"
  [ -f "$state_file" ] && [ "$(cat "$state_file")" = "down" ] && FAILURES=$((FAILURES + 1))
done

TOTAL=${#SERVICES[@]}
HEALTHY=$((TOTAL - FAILURES))
log "Summary: ${HEALTHY}/${TOTAL} services healthy"

# Critical service check — auth gets special treatment
AUTH_STATE_FILE="${STATE_DIR}/Grudge_Auth__SSO_.state"
if [ -f "$AUTH_STATE_FILE" ] && [ "$(cat "$AUTH_STATE_FILE")" = "down" ]; then
  notify_discord "🚨 CRITICAL: Auth Service (id.grudge-studio.com) is DOWN" "**All logins across the ecosystem are affected!**\\nVercel fallback is active but VPS auth needs attention.\\n\\n**VPS:** 74.208.155.229\\n**Coolify:** port 8000\\n**Action:** Check Docker container, restart if needed" "15158332"
fi

# If more than half are down, send critical alert
if [ "$FAILURES" -gt $((TOTAL / 2)) ]; then
  notify_discord "🔥 CRITICAL: ${FAILURES}/${TOTAL} services DOWN" "Multiple Grudge Studio services are failing. Check VPS immediately!\\n\\n**VPS:** 74.208.155.229\\n**Coolify:** port 8000" "15158332"
fi

log "=== Done ==="
