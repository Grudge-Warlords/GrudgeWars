/**
 * Grudge Studio Universal Monitor v1.0
 * Drop into any deployment with one script tag:
 *
 *   <script src="https://grudgewarlords.com/grudge-monitor.js"
 *           data-site="my-deployment-name"></script>
 *
 * Or self-hosted:
 *   <script src="/grudge-monitor.js" data-site="gruda-wars"></script>
 *
 * Features:
 *   - Catches window errors + unhandledrejection → POSTs to Legion Monitor
 *   - Activates Eruda mobile DevTools when ?debug=true in URL
 *   - Exposes window.GrudgeMonitor for manual error/event reporting
 *   - Zero dependencies, zero config required
 */
(function (global) {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────────
  const script = document.currentScript || {};
  const SITE = script.getAttribute('data-site') ||
    global.location?.hostname?.replace(/\./g, '-') || 'unknown';
  const MONITOR_URL = script.getAttribute('data-monitor-url') ||
    'https://legion-monitor.grudge.workers.dev';
  const DEBUG = new URLSearchParams(global.location?.search || '').get('debug') === 'true';
  const SESSION_ID = 'gm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

  // Rate limiting — max 20 errors per minute
  let _errorCount = 0;
  let _resetTimer = null;

  function canReport() {
    if (_errorCount >= 20) return false;
    _errorCount++;
    if (!_resetTimer) {
      _resetTimer = setTimeout(() => { _errorCount = 0; _resetTimer = null; }, 60000);
    }
    return true;
  }

  // ── Error Reporter ────────────────────────────────────────────────────────
  function report(type, message, stack, extra) {
    if (!canReport()) return;
    const payload = {
      site: SITE,
      type: type,
      message: String(message || '').slice(0, 1000),
      stack: String(stack || '').slice(0, 2000),
      url: global.location?.href || '',
      sessionId: SESSION_ID,
      userAgent: navigator?.userAgent?.slice(0, 200) || '',
      severity: type === 'unhandledrejection' ? 'error' : 'error',
      context: extra || {},
      ts: Date.now(),
    };

    // Use sendBeacon for fire-and-forget (won't block page)
    if (navigator?.sendBeacon) {
      navigator.sendBeacon(
        MONITOR_URL + '/error',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } else {
      fetch(MONITOR_URL + '/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }

  // ── Global Error Handlers ─────────────────────────────────────────────────
  global.addEventListener('error', function (event) {
    report('error', event.message, event.error?.stack, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  global.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    const message = reason?.message || String(reason) || 'Unhandled Promise Rejection';
    report('unhandledrejection', message, reason?.stack, {});
  });

  // ── Eruda DevTools (on ?debug=true) ───────────────────────────────────────
  if (DEBUG) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    document.head.appendChild(s);
    s.onload = function () {
      if (typeof eruda !== 'undefined') {
        eruda.init({
          tool: ['console', 'elements', 'network', 'resources', 'info'],
          useShadowDom: true,
          defaults: { displaySize: 50, transparency: 0.9 },
        });
        // Position above game UI
        var btn = document.querySelector('.eruda-entry-btn');
        if (btn) { btn.style.bottom = '80px'; btn.style.right = '10px'; }
        console.info('%c[GrudgeMonitor] Eruda DevTools active', 'color:#FF6B35;font-weight:bold');
      }
    };

    console.info(
      '%c⚡ Grudge Studio Debug Mode\n' +
      '%c  Site: ' + SITE + '\n' +
      '  Session: ' + SESSION_ID + '\n' +
      '  Monitor: ' + MONITOR_URL,
      'color:#FF6B35;font-size:13px;font-weight:bold',
      'color:#aaa;font-size:11px'
    );
  }

  // ── Public API ────────────────────────────────────────────────────────────
  global.GrudgeMonitor = {
    /** Manually report an error */
    reportError: function (message, stack, context) {
      report('manual', message, stack, context);
    },
    /** Report a custom event */
    reportEvent: function (eventName, data) {
      report('event', eventName, '', data || {});
    },
    /** Get current session ID */
    getSessionId: function () { return SESSION_ID; },
    /** Get monitor URL */
    getMonitorUrl: function () { return MONITOR_URL; },
    /** Manually trigger a health ping */
    ping: function () {
      return fetch(MONITOR_URL + '/ping').then(function (r) { return r.json(); });
    },
    site: SITE,
    debug: DEBUG,
  };

})(window);
