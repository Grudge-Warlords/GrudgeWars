import React from 'react';
import { statusEffectIcons } from '../data/spriteMap';

function getEffectKey(dot) {
  if (!dot) return 'dot';
  const src = (dot.source || '').toLowerCase();
  if (dot.heal) return 'heal_over_time';
  if (src.includes('bleed') || src.includes('razor') || src.includes('barb') || src.includes('lacerate') || src.includes('rend')) return 'bleed';
  if (src.includes('burn') || src.includes('fire') || src.includes('flame') || src.includes('ignite') || src.includes('molten') || src.includes('lava') || src.includes('eruption')) return 'burn';
  if (src.includes('poison') || src.includes('venom') || src.includes('toxic')) return 'poison';
  if (src.includes('frost') || src.includes('ice') || src.includes('freeze') || src.includes('cryo') || src.includes('glacial')) return 'frozen';
  return 'dot';
}

function getBuffKey(buff) {
  if (!buff) return 'buff_defense';
  if (buff.type === 'sleep') return 'sleep';
  if (buff.type === 'confuse') return 'confuse';
  if (buff.stat === 'defense') return 'buff_defense';
  if (buff.stat === 'damage') return 'buff_damage';
  if (buff.stat === 'attackSpeed' || buff.stat === 'evasion') return 'buff_speed';
  if (buff.multiplier && buff.multiplier < 1) return 'lower_attack';
  return 'shield';
}

function getDebuffKey(buff) {
  if (!buff) return 'lower_defense';
  if (buff.type === 'lower_defense') return 'lower_defense';
  if (buff.type === 'lower_attack') return 'lower_attack';
  return 'curse';
}

export default function StatusEffectIcons({ unit, size = 12, maxIcons = 5 }) {
  if (!unit || !unit.alive) return null;

  const icons = [];

  if (unit.stunned) {
    const hasSleep = (unit.buffs || []).some(b => b.type === 'sleep');
    icons.push({ key: hasSleep ? 'sleep' : 'stun', label: hasSleep ? 'Asleep' : 'Stunned' });
  }

  (unit.dots || []).forEach((dot, i) => {
    const effectKey = getEffectKey(dot);
    if (!icons.some(ic => ic.key === effectKey)) {
      icons.push({ key: effectKey, label: dot.source || effectKey, duration: dot.duration });
    }
  });

  (unit.buffs || []).forEach((buff, i) => {
    if (buff.type === 'sleep' || buff.type === 'confuse') {
      if (!icons.some(ic => ic.key === buff.type)) {
        icons.push({ key: buff.type, label: buff.source || buff.type, duration: buff.duration });
      }
    } else if (buff.debuff || buff.type === 'lower_defense' || buff.type === 'lower_attack') {
      const dk = getDebuffKey(buff);
      if (!icons.some(ic => ic.key === dk)) {
        icons.push({ key: dk, label: buff.source || dk, duration: buff.duration });
      }
    } else {
      const bk = getBuffKey(buff);
      if (!icons.some(ic => ic.key === bk)) {
        icons.push({ key: bk, label: buff.source || bk, duration: buff.duration });
      }
    }
  });

  const visible = icons.slice(0, maxIcons);
  if (visible.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 1,
      justifyContent: 'center',
      pointerEvents: 'none',
      position: 'absolute',
      bottom: -2,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
    }}>
      {visible.map((icon, i) => {
        const src = statusEffectIcons[icon.key];
        if (!src) return null;
        return (
          <div
            key={icon.key + i}
            title={icon.label + (icon.duration ? ` (${icon.duration}t)` : '')}
            style={{
              width: size,
              height: size,
              imageRendering: 'pixelated',
              position: 'relative',
              filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
            }}
          >
            <img
              src={src}
              alt={icon.label}
              style={{
                width: size,
                height: size,
                imageRendering: 'pixelated',
                display: 'block',
              }}
            />
            {icon.duration && (
              <span style={{
                position: 'absolute',
                bottom: -3,
                right: -2,
                fontSize: Math.max(6, size * 0.5),
                color: '#fff',
                textShadow: '0 0 2px #000, 0 0 2px #000',
                fontWeight: 900,
                lineHeight: 1,
                pointerEvents: 'none',
              }}>
                {icon.duration}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
