/**
 * Grudge Studio — Visual Debug Utilities
 *
 * USAGE IN ANY COMPONENT / THREE.JS SCENE:
 *
 *   import { createGui, debugStats, debugLog } from '../debug';
 *
 *   // lil-gui panel for live-tweaking Three.js values
 *   const gui = createGui('My Scene');
 *   gui.add(mesh.position, 'y', -10, 10).name('Height');
 *   gui.addColor(params, 'color').onChange(v => material.color.set(v));
 *
 *   // FPS + memory stats panel (top-left corner)
 *   const stats = debugStats();   // returns Stats instance or null
 *   // In your render loop:  stats?.begin(); renderer.render(scene, camera); stats?.end();
 *
 *   // Debug-only console log (silent in production unless ?debug=true)
 *   debugLog('scene loaded', mesh);
 *
 * ACTIVATING ON DEPLOYED SITES:
 *   Append ?debug=true to any URL — this enables Eruda (mobile DevTools)
 *   and all debug helpers on production without a rebuild.
 *
 * BROWSER EXTENSIONS (no install needed):
 *   - Spector.js  → https://github.com/BabylonJS/Spector.js (WebGL frame inspector)
 *   - Replay.io   → https://replay.io  (time-travel session recording)
 */

const IS_DEV = import.meta.env.DEV;
const DEBUG_PARAM = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debug') === 'true';
export const DEBUG = IS_DEV || DEBUG_PARAM;

// ─── Eruda (mobile DevTools) ────────────────────────────────────────────────

let _erudaReady = false;

export async function initEruda() {
  if (!DEBUG || _erudaReady) return;
  try {
    const { default: eruda } = await import('eruda');
    eruda.init({
      tool: ['console', 'elements', 'network', 'resources', 'info'],
      useShadowDom: true,
      autoScale: true,
      defaults: { displaySize: 50, transparency: 0.9 },
    });
    eruda.add(await import('eruda').then(() => {
      // Position the eruda button so it doesn't overlap game UI
      const btn = document.querySelector('.eruda-entry-btn');
      if (btn) { btn.style.bottom = '80px'; btn.style.right = '10px'; }
    }));
    _erudaReady = true;
    console.info('%c[Debug] Eruda DevTools active', 'color:#7DF9FF;font-weight:bold');
  } catch (e) {
    console.warn('[Debug] Eruda failed to load:', e);
  }
}

// ─── lil-gui (Three.js parameter tweaking) ──────────────────────────────────

const _guis = new Map();

/**
 * Creates (or returns cached) a lil-gui panel.
 * Returns a no-op stub in production unless ?debug=true.
 * @param {string} title - Panel title
 * @param {{ width?: number, collapsed?: boolean }} options
 * @returns {import('lil-gui').GUI | GUIStub}
 */
export async function createGui(title = 'Debug', options = {}) {
  if (!DEBUG) return new GUIStub();

  if (_guis.has(title)) return _guis.get(title);

  try {
    const { GUI } = await import('lil-gui');
    const gui = new GUI({
      title,
      width: options.width ?? 280,
      closeFolders: options.collapsed ?? false,
    });
    // Stack panels vertically if multiple are open
    const offset = _guis.size * 310;
    gui.domElement.style.right = '10px';
    gui.domElement.style.top = `${offset + 10}px`;
    gui.domElement.style.position = 'fixed';
    gui.domElement.style.zIndex = '9999';
    _guis.set(title, gui);
    return gui;
  } catch (e) {
    console.warn('[Debug] lil-gui failed to load:', e);
    return new GUIStub();
  }
}

/** Remove a gui panel by title */
export function destroyGui(title) {
  const gui = _guis.get(title);
  if (gui?.destroy) gui.destroy();
  _guis.delete(title);
}

/** Remove all open gui panels */
export function destroyAllGuis() {
  _guis.forEach(g => g?.destroy?.());
  _guis.clear();
}

// ─── stats.js (FPS / MS / Memory) ───────────────────────────────────────────

let _stats = null;

/**
 * Creates and mounts an FPS/MS/Memory stats panel.
 * Call stats.begin() before and stats.end() after each render.
 * Returns null in production unless ?debug=true.
 */
export async function debugStats() {
  if (!DEBUG) return null;
  if (_stats) return _stats;

  try {
    const { default: Stats } = await import('stats.js');
    _stats = new Stats();
    _stats.showPanel(0); // 0=fps, 1=ms, 2=mb
    _stats.dom.style.position = 'fixed';
    _stats.dom.style.top = '0px';
    _stats.dom.style.left = '0px';
    _stats.dom.style.zIndex = '9998';
    document.body.appendChild(_stats.dom);
    console.info('%c[Debug] Stats.js FPS panel active', 'color:#7DF9FF;font-weight:bold');
    return _stats;
  } catch (e) {
    console.warn('[Debug] stats.js failed to load:', e);
    return null;
  }
}

// ─── Debug log ──────────────────────────────────────────────────────────────

/**
 * Console.log only in debug mode. Silent in production.
 */
export function debugLog(...args) {
  if (DEBUG) console.log('%c[GrudgeDebug]', 'color:#FF6B35;font-weight:bold', ...args);
}

export function debugWarn(...args) {
  if (DEBUG) console.warn('%c[GrudgeDebug]', 'color:#FFD700;font-weight:bold', ...args);
}

// ─── Three.js scene helpers ──────────────────────────────────────────────────

/**
 * Add axis helper + grid to a Three.js scene (dev only).
 * @param {THREE.Scene} scene
 * @param {{ axisSize?: number, gridSize?: number, gridDivs?: number }} options
 */
export function addSceneHelpers(scene, options = {}) {
  if (!DEBUG) return;
  import('three').then(({ AxesHelper, GridHelper }) => {
    const axis = new AxesHelper(options.axisSize ?? 5);
    const grid = new GridHelper(options.gridSize ?? 20, options.gridDivs ?? 20);
    axis.name = '__debug_axis__';
    grid.name = '__debug_grid__';
    scene.add(axis, grid);
  });
}

/**
 * Remove debug scene helpers.
 * @param {THREE.Scene} scene
 */
export function removeSceneHelpers(scene) {
  ['__debug_axis__', '__debug_grid__'].forEach(name => {
    const obj = scene.getObjectByName(name);
    if (obj) scene.remove(obj);
  });
}

// ─── No-op stub for production builds ───────────────────────────────────────

class GUIStub {
  add() { return this; }
  addColor() { return this; }
  addFolder() { return this; }
  onChange() { return this; }
  onFinishChange() { return this; }
  name() { return this; }
  min() { return this; }
  max() { return this; }
  step() { return this; }
  listen() { return this; }
  open() { return this; }
  close() { return this; }
  destroy() {}
  show() {}
  hide() {}
}

// ─── Legion telemetry bridge ────────────────────────────────────────────────

/**
 * Call this inside your Three.js render loop to push FPS data into Legion telemetry.
 * debugStats() returns a stats.js instance; wrap it like:
 *   const stats = await debugStats();
 *   // in render loop: stats?.begin(); ... render ...; stats?.end(); debugPushPerf(stats);
 */
export function debugPushPerf(stats, scene = window.location?.pathname) {
  if (!DEBUG || !stats) return;
  import('../utils/legionService').then(({ legion }) => {
    // stats.js panel 0 = FPS, panel 2 = MB memory
    const fps = stats.getFPS ? stats.getFPS() : null;
    const memory = performance?.memory?.usedJSHeapSize
      ? Math.round(performance.memory.usedJSHeapSize / 1048576)
      : null;
    legion.pushPerf({ fps, memory, scene });
  }).catch(() => {});
}

// ─── Init (called from main.jsx) ─────────────────────────────────────────────

export function initDebug() {
  if (!DEBUG) return;
  initEruda();
  console.info(
    '%c🎮 Grudge Studio Debug Mode Active\n' +
    '%c  • Eruda DevTools (bottom-right button)\n' +
    '  • Use createGui() for Three.js tweaking\n' +
    '  • Use debugStats() for FPS panel\n' +
    '  • Use addSceneHelpers(scene) for axis/grid\n' +
    '  • Append ?debug=true to any URL to enable on prod',
    'color:#FF6B35;font-size:14px;font-weight:bold',
    'color:#aaa;font-size:11px'
  );
  // Expose on window for browser console access
  window.__GRUDGE_DEBUG__ = { createGui, debugStats, debugLog, debugPushPerf, addSceneHelpers, destroyAllGuis };
}
