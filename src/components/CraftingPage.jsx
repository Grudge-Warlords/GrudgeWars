import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import { TIERS, EQUIPMENT_SLOTS, UPGRADE_COSTS, upgradeItem, getItemPrice, getSellPrice } from '../data/equipment';
import { classDefinitions } from '../data/classes';
import { InlineIcon, getItemSpriteIcon } from '../data/uiSprites';
import useIsMobile from '../hooks/useIsMobile';
import { isPuterAvailable } from '../utils/puterService';
import { useLocationLore } from '../hooks/usePuterAI';

const RESOURCE_ICONS = {
  gold: { icon: 'pearl', label: 'Pearls', color: '#fbbf24' },
  herbs: { icon: 'herb', label: 'Algae', color: '#22c55e' },
  wood: { icon: 'wood', label: 'Root', color: '#a78bfa' },
  ore: { icon: 'ore', label: 'Shells', color: '#94a3b8' },
  crystals: { icon: 'crystal', label: 'Crystals', color: '#22d3ee' },
};

export default function CraftingPage() {
  const isMobile = useIsMobile();
  const { lore, loading: loreLoading, generateZoneLore } = useLocationLore();
  const {
    inventory, heroRoster, activeHeroIds, gold,
    harvestResources, setScreen, sellItem, upgradeEquipment,
  } = useGameStore();

  const [selectedItem, setSelectedItem] = useState(null);
  const [tab, setTab] = useState('inventory');

  const equipmentItems = inventory.filter(i => i && i.slot);
  const consumables = inventory.filter(i => i && i.type === 'consumable');

  const activeHeroes = heroRoster.filter(h =>
    h.id === 'player' || (activeHeroIds || []).includes(h.id)
  );

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'linear-gradient(180deg, #041225 0%, #0d1b2e 50%, #041225 100%)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/sunken_temple_battle.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.1,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 900, margin: '0 auto',
        padding: isMobile ? '16px 12px' : '24px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 className="font-cinzel" style={{
              color: '#a855f7', fontSize: isMobile ? '1.3rem' : '1.6rem',
              margin: 0, textShadow: '0 0 20px rgba(168,85,247,0.4)',
            }}>
              Root Workshop
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginTop: 2 }}>
              Manage equipment, upgrade gear, and trade resources
            </div>
          </div>
          <button onClick={() => setScreen('world')} style={{
            background: 'rgba(42,49,80,0.8)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 16px', color: 'var(--text)',
            cursor: 'pointer', fontSize: '0.75rem', minHeight: 36,
          }}>
            Back to Map
          </button>
        </div>

        <div style={{
          display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
        }}>
          {Object.entries(RESOURCE_ICONS).map(([key, res]) => (
            <div key={key} style={{
              background: `${res.color}10`, border: `1px solid ${res.color}30`,
              borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <InlineIcon name={res.icon} size={14} />
              <div>
                <div style={{ color: res.color, fontSize: '0.5rem', fontWeight: 600 }}>{res.label}</div>
                <div style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 700 }}>
                  {key === 'gold' ? gold : (harvestResources?.[key] || 0)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isPuterAvailable() && (
          <div style={{
            background: 'rgba(168,85,247,0.04)',
            border: '1px solid rgba(168,85,247,0.15)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          }}>
            {lore ? (
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>
                <span style={{ color: '#a855f7', fontWeight: 600, fontStyle: 'normal', marginRight: 4 }}>Workshop Lore:</span>
                {lore}
              </div>
            ) : (
              <button
                onClick={() => generateZoneLore('Root Workshop', 'An ancient crafting station deep in the grove where master artisans forge weapons from aquatic materials')}
                disabled={loreLoading}
                style={{
                  background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
                  borderRadius: 6, padding: '6px 14px', color: '#a855f7',
                  fontSize: '0.65rem', cursor: loreLoading ? 'wait' : 'pointer',
                  fontFamily: "'Cinzel', serif", fontWeight: 600, width: '100%', minHeight: 32,
                }}
              >
                {loreLoading ? 'Forging tales...' : 'Generate Workshop Lore'}
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['inventory', 'heroes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? 'rgba(168,85,247,0.2)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${tab === t ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6, padding: '8px 20px', color: tab === t ? '#a855f7' : 'var(--muted)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              fontFamily: "'Cinzel', serif", minHeight: 36,
            }}>
              {t === 'inventory' ? 'Inventory' : 'Heroes'}
            </button>
          ))}
        </div>

        {tab === 'inventory' && (
          <div>
            <h3 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 8 }}>
              Equipment ({equipmentItems.length})
            </h3>
            {equipmentItems.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', padding: 30 }}>
                No equipment in inventory. Hunt for loot!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
                {equipmentItems.map((item, idx) => {
                  const tier = TIERS[item.tier] || TIERS[1];
                  const sellPrice = getSellPrice(item);
                  return (
                    <div key={idx} style={{
                      background: `linear-gradient(135deg, ${tier.color}08, rgba(20,26,43,0.9))`,
                      border: `1px solid ${tier.color}30`,
                      borderRadius: 8, padding: 10,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: tier.color, fontSize: '0.7rem', fontWeight: 600 }}>
                          {item.name}
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.5rem', marginTop: 1 }}>
                          T{item.tier} {tier.name} | {item.slot}
                        </div>
                        {item.stats && (
                          <div style={{ color: 'var(--accent)', fontSize: '0.45rem', marginTop: 2 }}>
                            {Object.entries(item.stats).filter(([,v]) => v).map(([k,v]) => `+${v} ${k}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {sellPrice > 0 && (
                          <button onClick={() => sellItem(idx)} style={{
                            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                            borderRadius: 5, padding: '4px 8px', color: '#fbbf24',
                            fontSize: '0.5rem', cursor: 'pointer', fontWeight: 600,
                          }}>
                            Sell {sellPrice}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {consumables.length > 0 && (
              <>
                <h3 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.85rem', marginTop: 16, marginBottom: 8 }}>
                  Consumables ({consumables.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
                  {consumables.map((item, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 6, padding: 8, textAlign: 'center',
                    }}>
                      <div style={{ color: 'var(--text)', fontSize: '0.65rem', fontWeight: 600 }}>{item.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.45rem' }}>{item.description || 'Consumable'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'heroes' && (
          <div>
            <h3 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 8 }}>
              Hero Equipment
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeHeroes.map(hero => {
                const cls = classDefinitions[hero.classId];
                const equipped = hero.equipment || {};
                return (
                  <div key={hero.id} style={{
                    background: 'rgba(0,0,0,0.3)', border: `1px solid ${cls?.color || 'var(--border)'}30`,
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ color: cls?.color || '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{hero.name}</div>
                      <span style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>Lv.{hero.level}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4 }}>
                      {EQUIPMENT_SLOTS.map(slot => {
                        const item = equipped[slot];
                        const tier = item ? (TIERS[item.tier] || TIERS[1]) : null;
                        return (
                          <div key={slot} style={{
                            background: item ? `${tier.color}08` : 'rgba(0,0,0,0.15)',
                            border: `1px solid ${item ? tier.color + '25' : 'rgba(255,255,255,0.03)'}`,
                            borderRadius: 5, padding: '4px 6px',
                          }}>
                            <div style={{ fontSize: '0.4rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{slot}</div>
                            {item ? (
                              <div style={{ fontSize: '0.55rem', color: tier.color, fontWeight: 600 }}>{item.name}</div>
                            ) : (
                              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
