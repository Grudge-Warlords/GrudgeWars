import React, { useState } from 'react';
import { InlineIcon, getItemSpriteIcon } from '../data/uiSprites';
import { TIERS } from '../data/equipment';

const SLOT_ICONS = {
  helmet: 'shield',
  weapon: 'sword',
  armor: 'shield',
  offhand: 'shield',
  feet: 'boot',
  ring: 'crystal',
  relic: 'crystal',
};

const SLOT_LABELS = {
  helmet: 'Crown',
  weapon: 'Weapon',
  armor: 'Gills',
  offhand: 'Off-Fin',
  feet: 'Fins',
  ring: 'Scale',
  relic: 'Relic',
};

const SLOT_POSITIONS = {
  helmet:  { left: '72%', top: '24%' },
  weapon:  { left: '82%', top: '48%' },
  armor:   { left: '55%', top: '40%' },
  offhand: { left: '48%', top: '16%' },
  feet:    { left: '60%', top: '68%' },
  ring:    { left: '38%', top: '52%' },
  relic:   { left: '20%', top: '38%' },
};

export default function FishEquipPanel({ equipment = {}, size = 220, onSlotClick, onSlotHover, is2H = false, interactive = true, compact = false }) {
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const slotSize = compact ? size * 0.14 : size * 0.16;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
    }}>
      <img
        src="/images/betta_outline.png"
        alt="Equipment"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: 0.45,
          filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.25))',
          pointerEvents: 'none',
        }}
      />

      {Object.entries(SLOT_POSITIONS).map(([slot, pos]) => {
        const item = equipment[slot];
        const isLocked = slot === 'offhand' && is2H;
        const tierDef = item ? (TIERS[item.tier] || TIERS[1]) : null;
        const itemSprite = item ? getItemSpriteIcon(item) : null;
        const isHovered = hoveredSlot === slot;

        return (
          <div
            key={slot}
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              transform: 'translate(-50%, -50%)',
              width: slotSize,
              height: slotSize,
              borderRadius: '50%',
              background: isLocked
                ? 'rgba(60,60,60,0.7)'
                : item
                  ? `radial-gradient(circle, ${tierDef.color}30 0%, ${tierDef.color}10 60%, rgba(0,0,0,0.5) 100%)`
                  : 'rgba(10,15,30,0.7)',
              border: isLocked
                ? '2px solid #444'
                : item
                  ? `2px solid ${tierDef.color}90`
                  : '2px dashed rgba(100,140,180,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: interactive && !isLocked ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: isHovered && item
                ? `0 0 12px ${tierDef.color}60, inset 0 0 8px ${tierDef.color}20`
                : item
                  ? `0 0 6px ${tierDef.color}30`
                  : '0 0 4px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: isHovered ? 10 : 1,
            }}
            onClick={() => interactive && !isLocked && onSlotClick?.(slot)}
            onMouseEnter={() => {
              setHoveredSlot(slot);
              onSlotHover?.(slot);
            }}
            onMouseLeave={() => {
              setHoveredSlot(null);
              onSlotHover?.(null);
            }}
          >
            {isLocked ? (
              <span style={{ fontSize: slotSize * 0.4, color: '#555' }}>🔒</span>
            ) : item ? (
              <>
                {itemSprite ? (
                  <img src={itemSprite} alt={item.name} style={{
                    width: '70%', height: '70%', objectFit: 'contain',
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))',
                  }} />
                ) : (
                  <InlineIcon name={item.icon || SLOT_ICONS[slot]} size={slotSize * 0.5} />
                )}
                <div style={{
                  position: 'absolute', bottom: -1, left: '15%', right: '15%',
                  height: 3, borderRadius: 2,
                  background: tierDef.color,
                  boxShadow: `0 0 6px ${tierDef.color}`,
                }} />
              </>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                opacity: 0.5,
              }}>
                <InlineIcon name={SLOT_ICONS[slot]} size={slotSize * 0.35} />
              </div>
            )}

            {isHovered && !compact && (
              <div style={{
                position: 'absolute',
                bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                background: 'rgba(8,12,24,0.95)',
                border: `1px solid ${item ? tierDef.color + '60' : 'rgba(100,140,180,0.3)'}`,
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: '0.5rem',
                color: item ? tierDef.color : '#94a3b8',
                fontWeight: 600,
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}>
                {SLOT_LABELS[slot]}{item ? `: ${item.name}` : ' (empty)'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { SLOT_LABELS, SLOT_POSITIONS };
