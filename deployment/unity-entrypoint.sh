#!/usr/bin/env bash
# ============================================
# Grudge Warlords — Unity Headless Server Entrypoint
# Starts the Unity server + a minimal health-check HTTP sidecar
# ============================================
set -uo pipefail

GAME_PORT="${UNITY_SERVER_PORT:-7777}"
HEALTH_PORT="${UNITY_HEALTH_PORT:-7780}"
MAX_PLAYERS="${UNITY_MAX_PLAYERS:-100}"
TICK_RATE="${UNITY_TICK_RATE:-30}"
LOG_FILE="${UNITY_LOG_FILE:-/server/logs/unity.log}"
API_URL="${GRUDGE_API_URL:-http://grudge-server:3000}"
SERVER_NAME="${GAME_SERVER_NAME:-Grudge Warlords Dedicated}"
SERVER_REGION="${GAME_SERVER_REGION:-us-east-1}"

mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date)] Starting Grudge Warlords Unity Headless Server"
echo "[$(date)] Port: ${GAME_PORT} | Max Players: ${MAX_PLAYERS} | Tick Rate: ${TICK_RATE}"

# ── Start Unity server in background ────────
UNITY_BIN="/server/GrudgeWarlordsServer"

if [ ! -f "$UNITY_BIN" ]; then
  echo "[$(date)] WARNING: Unity binary not found at ${UNITY_BIN}"
  echo "[$(date)] Running in stub mode (health sidecar only)"
  UNITY_PID=""
else
  "$UNITY_BIN" \
    -batchmode \
    -nographics \
    -logFile "$LOG_FILE" \
    -port "$GAME_PORT" \
    -maxPlayers "$MAX_PLAYERS" \
    -tickRate "$TICK_RATE" \
    &
  UNITY_PID=$!
  echo "[$(date)] Unity server started (PID: ${UNITY_PID})"
fi

# ── Health-check HTTP sidecar ───────────────
# Minimal HTTP server using bash + socat/curl that:
# - Serves /health for Docker HEALTHCHECK
# - Sends heartbeat to Node.js API every 30s
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CURRENT_PLAYERS=0

unity_is_alive() {
  if [ -z "$UNITY_PID" ]; then
    return 0  # stub mode — always "alive"
  fi
  kill -0 "$UNITY_PID" 2>/dev/null
}

# Heartbeat loop — reports to Node.js API
heartbeat_loop() {
  while true; do
    sleep 30
    if unity_is_alive; then
      STATUS="online"
    else
      STATUS="crashed"
    fi
    # Fire-and-forget heartbeat to API
    curl -sf -X POST "${API_URL}/api/servers/unity/heartbeat" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"${SERVER_NAME}\",\"region\":\"${SERVER_REGION}\",\"port\":${GAME_PORT},\"status\":\"${STATUS}\",\"maxPlayers\":${MAX_PLAYERS},\"currentPlayers\":${CURRENT_PLAYERS},\"tickRate\":${TICK_RATE},\"startedAt\":\"${STARTED_AT}\"}" \
      2>/dev/null || true
  done
}
heartbeat_loop &
HEARTBEAT_PID=$!

# Minimal HTTP health responder using a bash while loop + /dev/tcp
# We use a simple approach: write a named pipe and serve via socat-like pattern
health_server() {
  while true; do
    if unity_is_alive; then
      HEALTH_STATUS="healthy"
      HTTP_CODE="200 OK"
    else
      HEALTH_STATUS="unhealthy"
      HTTP_CODE="503 Service Unavailable"
    fi

    UPTIME_SECS=$(( $(date +%s) - $(date -d "$STARTED_AT" +%s 2>/dev/null || echo 0) ))

    BODY="{\"status\":\"${HEALTH_STATUS}\",\"server\":\"${SERVER_NAME}\",\"port\":${GAME_PORT},\"maxPlayers\":${MAX_PLAYERS},\"currentPlayers\":${CURRENT_PLAYERS},\"uptime\":${UPTIME_SECS},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
    CONTENT_LENGTH=${#BODY}

    RESPONSE="HTTP/1.1 ${HTTP_CODE}\r\nContent-Type: application/json\r\nContent-Length: ${CONTENT_LENGTH}\r\nConnection: close\r\n\r\n${BODY}"

    echo -ne "$RESPONSE" | nc -l -p "$HEALTH_PORT" -q 1 2>/dev/null || \
    echo -ne "$RESPONSE" | nc -l -p "$HEALTH_PORT" -w 1 2>/dev/null || \
    { sleep 1; continue; }
  done
}
health_server &
HEALTH_PID=$!

echo "[$(date)] Health sidecar listening on :${HEALTH_PORT}"
echo "[$(date)] Heartbeat reporting to ${API_URL}"

# ── Graceful shutdown ───────────────────────
cleanup() {
  echo "[$(date)] Shutting down..."
  # Notify API that server is going offline
  curl -sf -X POST "${API_URL}/api/servers/unity/heartbeat" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${SERVER_NAME}\",\"status\":\"offline\",\"port\":${GAME_PORT}}" \
    2>/dev/null || true

  kill "$HEALTH_PID" 2>/dev/null
  kill "$HEARTBEAT_PID" 2>/dev/null
  [ -n "$UNITY_PID" ] && kill "$UNITY_PID" 2>/dev/null

  # Wait for Unity to exit gracefully (10s max)
  if [ -n "$UNITY_PID" ]; then
    for i in $(seq 1 10); do
      kill -0 "$UNITY_PID" 2>/dev/null || break
      sleep 1
    done
    kill -9 "$UNITY_PID" 2>/dev/null
  fi
  echo "[$(date)] Shutdown complete."
  exit 0
}
trap cleanup SIGTERM SIGINT SIGQUIT

# ── Wait for Unity process ──────────────────
if [ -n "$UNITY_PID" ]; then
  wait "$UNITY_PID"
  EXIT_CODE=$?
  echo "[$(date)] Unity server exited with code ${EXIT_CODE}"
  cleanup
else
  echo "[$(date)] Running in stub mode — waiting for SIGTERM"
  while true; do sleep 60; done
fi
