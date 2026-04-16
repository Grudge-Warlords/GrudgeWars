import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllFlatWeapons,
  getAllFlatArmor,
  getAllFlatConsumables,
  weaponFullIconByType,
  armorFullIconBySlot,
  consumableIcon,
} from '../data/objectStoreService';

const TIER_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ef4444',
};

const TIER_WEIGHTS = [
  { tier: 'common', weight: 40 },
  { tier: 'uncommon', weight: 25 },
  { tier: 'rare', weight: 18 },
  { tier: 'epic', weight: 10 },
  { tier: 'legendary', weight: 5 },
  { tier: 'mythic', weight: 2 },
];

function rollTier() {
  const total = TIER_WEIGHTS.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TIER_WEIGHTS) {
    r -= t.weight;
    if (r <= 0) return t.tier;
  }
  return 'common';
}

function pickRandom(arr, count = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const WEAPON_TYPE_MAP = {
  swords: 'sword', axes1h: 'axe', daggers: 'dagger', greatswords: 'sword',
  greataxes: 'axe', hammers1h: 'hammer', hammers2h: 'hammer', spears: 'spear',
  bows: 'bow', crossbows: 'crossbow', staves: 'staff', guns: 'crossbow',
  maces: 'hammer', polearms: 'spear', wands: 'staff', firearms: 'crossbow',
  throwables: 'dagger',
};

function generateLoot(weapons, armor, consumables, count = 3) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    const tier = rollTier();
    const tierColor = TIER_COLORS[tier] || '#9ca3af';

    if (roll < 0.45 && weapons.length > 0) {
      const w = pickRandom(weapons)[0];
      const iconType = WEAPON_TYPE_MAP[w.category] || 'sword';
      const iconIdx = Math.floor(Math.random() * 40) + 1;
      items.push({
        id: `loot-${i}-${Date.now()}`,
        type: 'weapon',
        name: w.name || 'Unknown Weapon',
        category: w.category,
        tier,
        tierColor,
        icon: weaponFullIconByType(iconType, iconIdx),
        stats: w.abilities ? { abilities: w.abilities.length } : {},
        lore: w.lore || '',
        damage: w.damage || Math.floor(10 + Math.random() * 40),
      });
    } else if (roll < 0.75 && armor.length > 0) {
      const a = pickRandom(armor)[0];
      const iconIdx = Math.floor(Math.random() * 30) + 1;
      items.push({
        id: `loot-${i}-${Date.now()}`,
        type: 'armor',
        name: a.name || 'Unknown Armor',
        slot: a.slot || 'chest',
        setName: a.setName,
        tier,
        tierColor,
        icon: armorFullIconBySlot(a.slot || 'chest', iconIdx),
        defense: a.defense || Math.floor(5 + Math.random() * 20),
      });
    } else if (consumables.length > 0) {
      const c = pickRandom(consumables)[0];
      const iconIdx = Math.floor(Math.random() * 20) + 1;
      items.push({
        id: `loot-${i}-${Date.now()}`,
        type: 'consumable',
        name: c.name || 'Unknown Item',
        category: c.category,
        tier,
        tierColor,
        icon: consumableIcon(`alchemy_${iconIdx}.png`),
        effect: c.effect || 'Restores health',
      });
    }
  }
  return items;
}

export default function LootRewards({ visible, palette, onClose }) {
  const [loot, setLoot] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([
      getAllFlatWeapons().catch(() => ({ weapons: [] })),
      getAllFlatArmor().catch(() => ({ armor: [] })),
      getAllFlatConsumables().catch(() => []),
    ]).then(([weaponData, armorData, consumableData]) => {
      const items = generateLoot(
        weaponData.weapons || [],
        armorData.armor || [],
        Array.isArray(consumableData) ? consumableData : [],
        3 + Math.floor(Math.random() * 2),
      );
      setLoot(items);
      setLoading(false);
    });
  }, [visible]);

  if (!visible) return null;

  const primary = palette?.primary || '#06b6d4';

  return (
    <div style={{
      animation: 'fadeSlide 0.4s ease',
      width: '100%', maxWidth: '520px',
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: 700,
        color: '#fbbf24', textAlign: 'center', marginBottom: '8px',
        textShadow: '0 0 20px #fbbf2440',
      }}>Battle Rewards</div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '16px' }}>
          Gathering loot...
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: '8px',
        }}>
          {loot.map(item => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: '80px', padding: '6px',
                background: hoveredItem === item.id
                  ? `linear-gradient(135deg, ${item.tierColor}20, ${item.tierColor}10)`
                  : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${item.tierColor}${hoveredItem === item.id ? '80' : '40'}`,
                borderRadius: '8px', textAlign: 'center',
                transition: 'all 0.2s', cursor: 'default',
                transform: hoveredItem === item.id ? 'translateY(-2px)' : 'none',
              }}
            >
              <div style={{
                width: '40px', height: '40px', margin: '0 auto 4px',
                borderRadius: '6px', overflow: 'hidden',
                background: `${item.tierColor}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={item.icon}
                  alt={item.name}
                  style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <div style={{
                fontSize: '9px', fontWeight: 700, color: item.tierColor,
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px',
              }}>{item.tier}</div>
              <div style={{
                fontSize: '10px', color: '#e2e8f0', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.name}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                {item.type === 'weapon' && `DMG ${item.damage}`}
                {item.type === 'armor' && `DEF ${item.defense}`}
                {item.type === 'consumable' && item.category}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', gap: '8px', justifyContent: 'center',
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            padding: '6px 20px', borderRadius: '8px',
            border: `1px solid ${primary}44`,
            background: `${primary}15`, color: primary,
            cursor: 'pointer', fontWeight: 600, fontSize: '11px',
          }}>Collect All</button>
        )}
      </div>
    </div>
  );
}
