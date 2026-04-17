/**
 * Gruda Legion AI Service
 *
 * The Legion is the overarching AI command system for Grudge Studio.
 * It collects real-time game telemetry (scene state, performance, player events)
 * and uses it as grounding context when answering queries or generating content.
 *
 * USAGE:
 *   import { legion } from './legionService';
 *
 *   // Track a game event (queued and batch-sent)
 *   legion.track('battle_start', { zone: 'Zone 5', enemies: 3, playerHp: 80 });
 *   legion.track('scene_change', { from: '/play', to: '/arena' });
 *   legion.track('player_action', { type: 'craft', item: 'Iron Sword' });
 *
 *   // Query the Legion AI with current game context
 *   const { response } = await legion.query('What should the player do next?');
 *   const { response } = await legion.query('Generate a boss encounter for zone 5', {
 *     zone: 'Volcanic Depths', difficulty: 'hard'
 *   });
 *
 *   // Push a performance snapshot (called automatically by debug/index.js)
 *   legion.pushPerf({ fps: 58, memory: 120, scene: '/play' });
 *
 *   // Get the current session snapshot
 *   const state = legion.getState();
 */

const LEGION_API = '/api/legion';
const EMIT_INTERVAL_MS = 30_000;   // auto-flush telemetry every 30s
const MAX_QUEUE = 50;               // max events held before forced flush
const SESSION_ID = `gruda-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Internal State ────────────────────────────────────────────────────────

let _queue = [];
let _perfHistory = [];   // rolling 10-point perf window
let _activeScene = '/';
let _playerInfo = null;
let _emitTimer = null;
let _initialized = false;

// ─── Init ──────────────────────────────────────────────────────────────────

function init(config = {}) {
  if (_initialized) return;
  _initialized = true;
  if (config.scene) _activeScene = config.scene;
  if (config.player) _playerInfo = config.player;

  // Auto-flush telemetry on interval
  _emitTimer = setInterval(() => {
    if (_queue.length > 0) _flush();
  }, EMIT_INTERVAL_MS);

  // Flush remaining events on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => _flush(true));
  }

  console.info('%c[Legion] Session started:', 'color:#FF6B35;font-weight:bold', SESSION_ID);
}

// ─── Telemetry ─────────────────────────────────────────────────────────────

/**
 * Track a game event. Queued for batch-send.
 * @param {string} type - Event type (e.g. 'battle_start', 'scene_change', 'player_action')
 * @param {object} data - Event payload
 */
function track(type, data = {}) {
  _queue.push({
    type,
    data,
    scene: _activeScene,
    ts: Date.now(),
    sessionId: SESSION_ID,
  });
  if (_queue.length >= MAX_QUEUE) _flush();
}

/**
 * Push a performance snapshot from the debug stats loop.
 * @param {{ fps: number, memory: number, scene: string }} perf
 */
function pushPerf(perf) {
  _perfHistory.push({ ...perf, ts: Date.now() });
  if (_perfHistory.length > 10) _perfHistory.shift();

  // Auto-track perf degradation events
  if (perf.fps < 30) {
    track('perf_warning', { fps: perf.fps, memory: perf.memory, scene: perf.scene });
  }
}

/**
 * Set the current active scene (call on route changes).
 */
function setScene(scene) {
  if (scene !== _activeScene) {
    track('scene_change', { from: _activeScene, to: scene });
    _activeScene = scene;
  }
}

/**
 * Set player info for context enrichment.
 */
function setPlayer(playerInfo) {
  _playerInfo = playerInfo;
}

// ─── Flush ────────────────────────────────────────────────────────────────

async function _flush(sync = false) {
  if (_queue.length === 0) return;
  const batch = [..._queue];
  _queue = [];

  const payload = {
    sessionId: SESSION_ID,
    events: batch,
    perf: _perfHistory.slice(-3),
    scene: _activeScene,
    player: _playerInfo,
    ts: Date.now(),
  };

  try {
    if (sync && navigator.sendBeacon) {
      // sendBeacon for beforeunload (non-blocking)
      navigator.sendBeacon(
        `${LEGION_API}/telemetry`,
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } else {
      await fetch(`${LEGION_API}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    }
  } catch (e) {
    // Non-critical — restore queue on failure so we don't lose events
    _queue = [...batch, ..._queue].slice(-MAX_QUEUE);
  }
}

// ─── Query ────────────────────────────────────────────────────────────────

/**
 * Query the Gruda Legion AI with the current game context.
 * @param {string} prompt - What to ask the Legion
 * @param {object} extraContext - Additional context to include
 * @param {{ mode?: 'fast'|'balanced'|'deep', signal?: AbortSignal }} options
 * @returns {Promise<{ response: string, sessionId: string, ts: number }>}
 */
async function query(prompt, extraContext = {}, options = {}) {
  // Flush any pending events first so the server has the latest state
  await _flush();

  const payload = {
    prompt,
    sessionId: SESSION_ID,
    context: {
      scene: _activeScene,
      player: _playerInfo,
      recentPerf: _perfHistory.slice(-5),
      ...extraContext,
    },
    mode: options.mode || 'balanced',
  };

  const res = await fetch(`${LEGION_API}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Legion query failed: ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Get the live snapshot from the Legion server (aggregated telemetry).
 */
async function getServerSnapshot() {
  const res = await fetch(`${LEGION_API}/snapshot`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Legion snapshot failed: ${res.status}`);
  return res.json();
}

/**
 * Get the current client-side state (not server).
 */
function getState() {
  return {
    sessionId: SESSION_ID,
    scene: _activeScene,
    player: _playerInfo,
    queuedEvents: _queue.length,
    recentPerf: _perfHistory.slice(-5),
    initialized: _initialized,
  };
}

// ─── Destroy ──────────────────────────────────────────────────────────────

function destroy() {
  _flush(true);
  if (_emitTimer) { clearInterval(_emitTimer); _emitTimer = null; }
  _initialized = false;
}

// ─── Export ───────────────────────────────────────────────────────────────

export const legion = {
  init,
  track,
  pushPerf,
  setScene,
  setPlayer,
  query,
  getServerSnapshot,
  getState,
  destroy,
  SESSION_ID,
};

export default legion;
