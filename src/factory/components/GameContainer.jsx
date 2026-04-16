import React, { useState, useEffect } from 'react';

export default function GameContainer({ children, spec, style = {} }) {
  const palette = spec?.meta?.colorPalette || {};
  const primary = palette.primary || '#06b6d4';
  const bg = palette.background || '#050a18';
  const gameName = spec?.meta?.gameName || 'Game';
  const [cornerGlow, setCornerGlow] = useState(0);

  useEffect(() => {
    let frame;
    const animate = () => {
      setCornerGlow(prev => (prev + 0.5) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: bg,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        border: `2px solid ${primary}30`,
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 50,
      }}>
        <div style={{
          position: 'absolute', top: -1, left: -1, width: 16, height: 16,
          borderTop: `2px solid ${primary}`,
          borderLeft: `2px solid ${primary}`,
          borderTopLeftRadius: 4,
          filter: `drop-shadow(0 0 4px ${primary}66)`,
        }} />
        <div style={{
          position: 'absolute', top: -1, right: -1, width: 16, height: 16,
          borderTop: `2px solid ${primary}`,
          borderRight: `2px solid ${primary}`,
          borderTopRightRadius: 4,
          filter: `drop-shadow(0 0 4px ${primary}66)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -1, left: -1, width: 16, height: 16,
          borderBottom: `2px solid ${primary}`,
          borderLeft: `2px solid ${primary}`,
          borderBottomLeftRadius: 4,
          filter: `drop-shadow(0 0 4px ${primary}66)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -1, right: -1, width: 16, height: 16,
          borderBottom: `2px solid ${primary}`,
          borderRight: `2px solid ${primary}`,
          borderBottomRightRadius: 4,
          filter: `drop-shadow(0 0 4px ${primary}66)`,
        }} />

        <div style={{
          position: 'absolute', top: -1, left: 20, right: 20, height: '1px',
          background: `linear-gradient(90deg, transparent, ${primary}40, transparent)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -1, left: 20, right: 20, height: '1px',
          background: `linear-gradient(90deg, transparent, ${primary}40, transparent)`,
        }} />
        <div style={{
          position: 'absolute', left: -1, top: 20, bottom: 20, width: '1px',
          background: `linear-gradient(180deg, transparent, ${primary}40, transparent)`,
        }} />
        <div style={{
          position: 'absolute', right: -1, top: 20, bottom: 20, width: '1px',
          background: `linear-gradient(180deg, transparent, ${primary}40, transparent)`,
        }} />
      </div>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, transparent 5%, ${primary}50 50%, transparent 95%)`,
        zIndex: 51,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
