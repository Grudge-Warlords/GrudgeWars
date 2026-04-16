import { useEffect } from 'react';

const CURSOR_NORMAL = "url('/images/ui/cursor-gauntlet.svg') 6 2, auto";
const CURSOR_CLICK = "url('/images/ui/cursor-gauntlet-click.svg') 6 2, auto";

export default function GauntletCursor() {
  useEffect(() => {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile) return;

    const root = document.documentElement;
    root.style.cursor = CURSOR_NORMAL;

    const style = document.createElement('style');
    style.id = 'gauntlet-cursor-styles';
    style.textContent = `
      *, *::before, *::after {
        cursor: inherit !important;
      }
      a, button, [role="button"], input[type="submit"], input[type="button"],
      select, label[for], .clickable, [onclick] {
        cursor: ${CURSOR_NORMAL} !important;
      }
      input[type="text"], input[type="number"], input[type="email"],
      input[type="password"], input[type="search"], textarea, [contenteditable="true"] {
        cursor: text !important;
      }
      [style*="cursor: not-allowed"], .disabled, [disabled] {
        cursor: not-allowed !important;
      }
      canvas {
        cursor: ${CURSOR_NORMAL} !important;
      }
    `;
    document.head.appendChild(style);

    let clickTimeout = null;

    const onDown = () => {
      root.style.cursor = CURSOR_CLICK;
      if (clickTimeout) clearTimeout(clickTimeout);
    };

    const onUp = () => {
      clickTimeout = setTimeout(() => {
        root.style.cursor = CURSOR_NORMAL;
      }, 120);
    };

    const spawnClickEffect = (e) => {
      const spark = document.createElement('div');
      spark.className = 'gauntlet-click-spark';
      spark.style.left = e.clientX + 'px';
      spark.style.top = e.clientY + 'px';
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 500);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('click', spawnClickEffect);

    return () => {
      root.style.cursor = '';
      style.remove();
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('click', spawnClickEffect);
      if (clickTimeout) clearTimeout(clickTimeout);
    };
  }, []);

  return null;
}
