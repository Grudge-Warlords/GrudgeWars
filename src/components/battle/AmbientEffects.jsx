import React, { useMemo, useState, useEffect } from 'react';

const MOTE_COUNT = 18;
const EMBER_COUNT = 8;
const MOBILE_MOTE_COUNT = 8;
const MOBILE_EMBER_COUNT = 3;

function generateMotes(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 1.5 + Math.random() * 2.5,
    duration: 12 + Math.random() * 18,
    delay: Math.random() * -20,
    opacity: 0.15 + Math.random() * 0.25,
    drift: -30 + Math.random() * 60,
  }));
}

function generateEmbers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * -10,
    hue: Math.random() > 0.5 ? 45 : 190,
  }));
}

export default function AmbientEffects() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const moteCount = isMobile ? MOBILE_MOTE_COUNT : MOTE_COUNT;
  const emberCount = isMobile ? MOBILE_EMBER_COUNT : EMBER_COUNT;
  const motes = useMemo(() => generateMotes(moteCount), [moteCount]);
  const embers = useMemo(() => generateEmbers(emberCount), [emberCount]);

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
    }}>
      <div className="ambient-fog-layer ambient-fog-1" />
      <div className="ambient-fog-layer ambient-fog-2" />

      {!isMobile && <div className="ambient-caustic-overlay" />}

      {motes.map(m => (
        <div
          key={`mote-${m.id}`}
          className="ambient-mote"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            opacity: m.opacity,
            '--drift': `${m.drift}px`,
          }}
        />
      ))}

      {embers.map(e => (
        <div
          key={`ember-${e.id}`}
          className="ambient-ember"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            '--ember-hue': e.hue,
          }}
        />
      ))}

      <div className="ambient-vignette" />
    </div>
  );
}
