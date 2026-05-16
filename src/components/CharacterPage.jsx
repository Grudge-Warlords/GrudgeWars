import React, { useState, useEffect } from 'react';
import PortalHeader from './portal/PortalHeader';
import SpriteAnimation from './SpriteAnimation';
import { raceDefinitions, raceList } from '../data/races';
import { classDefinitions } from '../data/classes';
import { attributeDefinitions, calculateStats, calculateCombatPower } from '../data/attributes';
import { getPlayerSprite } from '../data/spriteMap';
import {
  getClassSkillIcon,
  getWeaponIcon,
  getProfessionIcon,
  getArmorIcon,
  getMaterialIcon,
  getAttributeIcon,
  getConsumableIcon,
  OBJECTSTORE_BASE,
} from '../data/objectStoreIcons';
import { BUILDER_URL } from '../utils/studioUrls';
import {
  getStartingEquipment, getStartingInventory, getStartingAttributes,
  EQUIP_SLOT_ORDER, EQUIP_SLOT_LABELS, ATTR_KEYS, STARTING_GOLD,
} from '../data/startingLoadouts';

// â”€â”€ Shared style constants (matches StudioPortal) â”€â”€
const GOLD = '#d4a96a';
const GOLD_BRIGHT = '#FAAC47';
const GOLD_GRADIENT = 'linear-gradient(90deg, #DB6331, #FAAC47, #FFE0A0, #FAAC47, #DB6331)';
const BG = '#0a0a12';
const PANEL = 'rgba(255,255,255,0.02)';
const BORDER = 'rgba(212,169,106,0.15)';
const MUTED = 'rgba(255,255,255,0.4)';

// â”€â”€ Data â”€â”€
const CLASSES = Object.entries(classDefinitions).map(([id, def]) => ({ id, ...def }));

const PROFESSIONS = [
  { key: 'Miner',    color: '#ef4444', role: 'Metal Â· Weapons Â· Armor',       desc: 'Extract ore and stone from the depths. Smelt ingots and forge deadly weapons and armor.' },
  { key: 'Forester', color: '#22c55e', role: 'Wood Â· Bows Â· Leather',         desc: 'Harvest timber and tan hides. Craft bows, crossbows, and leather armor.' },
  { key: 'Mystic',   color: '#a78bfa', role: 'Cloth Â· Staves Â· Enchants',     desc: 'Gather arcane dust and weave cloth. Create staves, tomes, and enchanted gear.' },
  { key: 'Chef',     color: '#f59e0b', role: 'Food Â· Potions Â· Buffs',        desc: 'Cook hearty meals and brew potions that grant powerful combat buffs.' },
  { key: 'Engineer', color: '#60a5fa', role: 'Guns Â· Crossbows Â· Traps',      desc: 'Assemble precision mechanisms. Build firearms, crossbows, and tactical traps.' },
];

const BUILDINGS = [
  { type: 'camp',     emoji: 'â›º', label: 'Camp',        desc: 'Claim your island and establish a foothold.' },
  { type: 'mine',     emoji: 'â›ï¸', label: 'Mine',        desc: 'Produces ore and stone passively.' },
  { type: 'lumber',   emoji: 'ðŸª“', label: 'Lumber Mill', desc: 'Produces wood from the surrounding forest.' },
  { type: 'herb',     emoji: 'ðŸŒ¿', label: 'Herb Garden', desc: 'Grows herbs for potions and enchanting.' },
  { type: 'kitchen',  emoji: 'ðŸ³', label: 'Kitchen',     desc: 'Cooks food to keep your heroes fed.' },
  { type: 'workshop', emoji: 'ðŸ”§', label: 'Workshop',    desc: 'Produces crystals and refined parts.' },
  { type: 'farm',     emoji: 'ðŸŒ¾', label: 'Farm',        desc: 'Grows crops for sustenance and trade.' },
];

const RANK_TIERS = [
  { name: 'Bronze',   wins: '0+',  color: '#cd7f32' },
  { name: 'Silver',   wins: '5+',  color: '#c0c0c0' },
  { name: 'Gold',     wins: '10+', color: '#ffd700' },
  { name: 'Platinum', wins: '20+', color: '#6ee7b7' },
  { name: 'Diamond',  wins: '35+', color: '#60a5fa' },
  { name: 'Legend',   wins: '50+', color: '#f59e0b' },
];

// â”€â”€ Reusable sub-components â”€â”€

function SectionHeading({ children, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <h2 style={{
        fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        background: GOLD_GRADIENT, backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: 4, margin: 0,
      }}>{children}</h2>
      {sub && <div style={{ color: MUTED, fontSize: '0.8rem', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style, accent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: PANEL, borderRadius: 12,
        border: `1px solid ${hovered && accent ? accent + '55' : BORDER}`,
        padding: 20, transition: 'all 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 30px rgba(0,0,0,0.3)` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function IconImg({ src, size = 32, style }) {
  return (
    <img
      src={src} alt="" loading="lazy"
      style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated', ...style }}
    />
  );
}

function CtaButton({ href, children, primary, style }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href} target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '14px 32px', borderRadius: 10, textDecoration: 'none',
        fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: '1rem',
        fontWeight: 700, letterSpacing: 3, transition: 'all 0.2s',
        ...(primary ? {
          background: hovered ? 'linear-gradient(135deg, #FAAC47, #DB6331)' : 'linear-gradient(135deg, #DB6331, #FAAC47)',
          color: '#0a0a12', border: 'none',
          boxShadow: hovered ? '0 6px 24px rgba(250,172,71,0.35)' : '0 4px 16px rgba(250,172,71,0.15)',
        } : {
          background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
          color: GOLD_BRIGHT,
          border: `2px solid ${hovered ? GOLD_BRIGHT + '88' : GOLD_BRIGHT + '44'}`,
        }),
        ...style,
      }}
    >
      {children}
    </a>
  );
}

// â”€â”€ Section: Races â”€â”€

function RacesSection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="6 races, each with unique attribute bonuses and racial traits">CHOOSE YOUR RACE</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {raceList.map(race => (
          <Card key={race.id} accent={race.color}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: `${race.color}15`, border: `2px solid ${race.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                <IconImg src={race.icon} size={40} />
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.05rem', color: race.color, fontWeight: 700 }}>
                  {race.name}
                </div>
                <div style={{
                  fontSize: '0.65rem', color: race.color, opacity: 0.7,
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  {race.trait}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 10 }}>
              {race.description}
            </div>
            <div style={{
              fontSize: '0.7rem', color: MUTED, padding: '6px 10px',
              background: 'rgba(255,255,255,0.03)', borderRadius: 6,
              border: `1px solid ${BORDER}`,
            }}>
              <span style={{ color: race.color, fontWeight: 600 }}>Bonus:</span> {race.passive}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// â”€â”€ Section: Classes â”€â”€

function ClassCard({ cls }) {
  const sprite = getPlayerSprite(cls.id);
  const abilities = cls.abilities?.slice(0, 4) || [];

  return (
    <Card accent={cls.color} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        {/* Sprite preview */}
        <div style={{
          width: 100, height: 120, borderRadius: 10,
          background: `radial-gradient(circle at 50% 80%, ${cls.color}20, transparent 70%)`,
          border: `1px solid ${cls.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative', flexShrink: 0,
        }}>
          {sprite && (
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
              <SpriteAnimation spriteData={sprite} animation="idle" scale={2.5} speed={150} containerless={false} />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: cls.color, fontWeight: 700 }}>
            {cls.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginTop: 4 }}>
            {cls.description}
          </div>
        </div>
      </div>

      {/* Abilities */}
      <div style={{ fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>
        Abilities
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {abilities.map((ab, i) => (
          <div key={ab.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
          }}>
            <IconImg src={getClassSkillIcon(cls.id, i + 1)} size={24} />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#e8dcc8', fontWeight: 600 }}>{ab.name}</div>
              <div style={{ fontSize: '0.6rem', color: MUTED }}>{ab.type}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Signature */}
      {cls.signatureAbility && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 8,
          background: `${cls.color}10`, border: `1px solid ${cls.color}33`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <IconImg src={getClassSkillIcon(cls.id, 5)} size={28} />
          <div>
            <div style={{ fontSize: '0.75rem', color: cls.color, fontWeight: 700 }}>
              {cls.signatureAbility.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: MUTED }}>{cls.signatureAbility.description}</div>
          </div>
        </div>
      )}
    </Card>
  );
}

function ClassesSection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="4 classes with unique combat styles, abilities, and signature moves">MASTER YOUR CLASS</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {CLASSES.map(cls => <ClassCard key={cls.id} cls={cls} />)}
      </div>
    </section>
  );
}

// â”€â”€ Section: Attributes â”€â”€

function AttributesSection() {
  const attrs = Object.entries(attributeDefinitions);
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="8 Grudge attributes shape your hero's strengths and combat power">THE GRUDGE ATTRIBUTES</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {attrs.map(([name, def]) => (
          <Card key={name} accent={def.color}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <IconImg src={getAttributeIcon(name) || def.icon} size={28} />
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.9rem', color: def.color, fontWeight: 700 }}>
                {name}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {def.description}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// â”€â”€ Section: Crafting & Professions â”€â”€

function CraftingSection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="5 harvesting professions with tiered progression, recipes, and gear crafting">CRAFTING & PROFESSIONS</SectionHeading>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {PROFESSIONS.map(prof => {
          const iconUrl = getProfessionIcon(prof.key);
          return (
            <Card key={prof.key} accent={prof.color}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                {iconUrl
                  ? <IconImg src={iconUrl} size={40} />
                  : <span style={{ fontSize: 28 }}>âš’ï¸</span>}
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: prof.color, fontWeight: 700 }}>
                    {prof.key}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: MUTED }}>{prof.role}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {prof.desc}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Material tiers preview */}
      <div style={{
        background: PANEL, borderRadius: 12, border: `1px solid ${BORDER}`,
        padding: 20, textAlign: 'center',
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: GOLD, marginBottom: 12 }}>
          8 Material Tiers
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[1,2,3,4,5,6,7,8].map(tier => (
            <div key={tier} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
              minWidth: 60,
            }}>
              <IconImg src={getMaterialIcon('ore', tier)} size={32} />
              <span style={{ fontSize: '0.65rem', color: MUTED }}>T{tier}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <CtaButton href="/crafting-suite">OPEN CRAFTING SUITE</CtaButton>
        </div>
      </div>
    </section>
  );
}

// â”€â”€ Section: Home Island & AFK Harvesting â”€â”€

function IslandSection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="Deploy heroes to your personal island and harvest resources while you're away">HOME ISLAND & AFK HARVESTING</SectionHeading>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Island overview */}
        <Card accent="#ff6b35" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: '#ff6b35', fontWeight: 700, marginBottom: 8 }}>
                ðŸï¸ Your Personal Island
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
                Every player gets a procedurally-generated island with beaches, grasslands, forests, and mountains.
                Place buildings, assign idle heroes, and collect resources automatically over time.
                Heroes gain profession XP while harvesting, leveling up their crafting skills passively.
              </div>
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap',
              }}>
                <InfoPill label="Auto-Harvest" value="Resources accumulate over time" color="#00ff88" />
                <InfoPill label="Hero Deploy" value="Assign idle heroes to buildings" color="#60a5fa" />
                <InfoPill label="Prof. XP" value="Heroes gain crafting XP passively" color="#a78bfa" />
              </div>
            </div>
          </div>
        </Card>

        {/* Buildings grid */}
        {BUILDINGS.map(b => (
          <Card key={b.type} accent="#ff6b35" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{b.emoji}</span>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: '#e8dcc8', fontWeight: 600 }}>
                  {b.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: MUTED }}>{b.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function InfoPill({ label, value, color }) {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 8,
      background: `${color}10`, border: `1px solid ${color}33`,
      fontSize: '0.7rem',
    }}>
      <span style={{ color, fontWeight: 700 }}>{label}: </span>
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>
    </div>
  );
}

// â”€â”€ Section: Gameplay / Arena â”€â”€

function GameplaySection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="Turn-based combat, ranked arena PvP, and epic loot">GRUDGE WARS GAMEPLAY</SectionHeading>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Combat */}
        <Card accent="#ef4444">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>
            âš”ï¸ Turn-Based Combat
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Build a party of up to 3 heroes. Each class plays differently â€” Warriors tank and cleave,
            Mage Priests heal and nuke, Rangers deal precision damage, and Worges shapeshift and summon.
          </div>
          {/* Class sprite row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14, overflow: 'hidden' }}>
            {['warrior', 'mage', 'ranger', 'worge'].map(cls => {
              const sprite = getPlayerSprite(cls);
              return sprite ? (
                <div key={cls} style={{
                  width: 60, height: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <SpriteAnimation spriteData={sprite} animation="idle" scale={1.8} speed={160} containerless={false} />
                </div>
              ) : null;
            })}
          </div>
        </Card>

        {/* Arena */}
        <Card accent="#3b82f6">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#3b82f6', fontWeight: 700, marginBottom: 8 }}>
            ðŸ† Ranked Arena
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12 }}>
            Submit your team to the arena and climb the leaderboard. AI controls your defenders when
            other players challenge you. Earn rank badges from Bronze to Legend.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RANK_TIERS.map(tier => (
              <span key={tier.name} style={{
                padding: '3px 10px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
                background: `${tier.color}15`, border: `1px solid ${tier.color}44`, color: tier.color,
              }}>
                {tier.name} ({tier.wins})
              </span>
            ))}
          </div>
        </Card>

        {/* Equipment */}
        <Card accent="#FAAC47">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#FAAC47', fontWeight: 700, marginBottom: 8 }}>
            ðŸ›¡ï¸ Equipment & Loot
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12 }}>
            Equip weapons, armor, and relics across 12 gear slots. Gear ranges from Crude (T0)
            through 8 tiers of power. Craft, loot from battles, or trade with other players.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['sword', 'bow', 'staff', 'shield', 'dagger', 'hammer2h'].map(wt => (
              <div key={wt} style={{
                width: 44, height: 44, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconImg src={getWeaponIcon(wt)} size={32} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

// â”€â”€ Footer CTAs â”€â”€

function FooterCTAs() {
  return (
    <section style={{ textAlign: 'center', padding: '32px 0 20px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <CtaButton href="/play" primary>PLAY NOW</CtaButton>
        <CtaButton href={BUILDER_URL + '/character'}>BUILD A CHARACTER</CtaButton>
        <CtaButton href="https://discord.gg/FtGtmxmwkh">JOIN DISCORD</CtaButton>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
        &copy; 2026 Grudge Studio &mdash; All Rights Reserved
      </div>
    </section>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN CHARACTER PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// ── Tab Navigation ──

const TABS = [
  { id: 'races',      label: 'Races',       color: '#FAAC47' },
  { id: 'classes',     label: 'Classes',      color: '#ef4444' },
  { id: 'attributes',  label: 'Attributes',   color: '#3b82f6' },
  { id: 'crafting',    label: 'Crafting',     color: '#22c55e' },
  { id: 'island',      label: 'Island',       color: '#ff6b35' },
  { id: 'gameplay',    label: 'Gameplay',     color: '#a78bfa' },
  { id: 'avatar',      label: 'Avatar & NFT', color: '#ec4899' },
];

function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '0 24px', maxWidth: 1100, margin: '0 auto',
      overflowX: 'auto', scrollbarWidth: 'none',
      borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.3)',
    }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 18px', border: 'none', borderRadius: '8px 8px 0 0',
              background: active ? `${tab.color}18` : 'transparent',
              color: active ? tab.color : MUTED,
              fontFamily: "'Cinzel', serif", fontSize: '0.75rem', fontWeight: active ? 700 : 500,
              letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: active ? `3px solid ${tab.color}` : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Avatar & cNFT Section ──

const ATTR_COLORS = {
  Strength: '#ef4444', Vitality: '#22c55e', Endurance: '#6b7280', Dexterity: '#f59e0b',
  Agility: '#06b6d4', Intellect: '#3b82f6', Wisdom: '#a855f7', Tactics: '#64748b',
};

function AvatarSection() {
  const [selectedRace, setSelectedRace] = useState('human');
  const [selectedClass, setSelectedClass] = useState('warrior');
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(100);
  const [bright, setBright] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [error, setError] = useState(null);

  const sprite = getPlayerSprite(selectedClass, selectedRace);
  const race = raceDefinitions[selectedRace];
  const cls = classDefinitions[selectedClass];

  // Computed data
  const startAttrs = getStartingAttributes(cls, race);
  const startStats = calculateStats(startAttrs, 0);
  const combatPower = calculateCombatPower(startStats);
  const equip = getStartingEquipment(selectedClass);
  const inventory = getStartingInventory(selectedClass);

  // Custom sprite filter
  const baseFilter = sprite?.filter || '';
  const customFilter = `${baseFilter} hue-rotate(${hue}deg) saturate(${sat}%) brightness(${bright}%)`;
  const coloredSprite = sprite ? { ...sprite, filter: customFilter.trim() } : null;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setAvatarUrl(null);
    try {
      const token = localStorage.getItem('grudge_auth_token');
      const res = await fetch('https://id.grudge-studio.com/api/auth/user', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Sign in to generate avatars');
      const genRes = await fetch('https://api.grudge-studio.com/api/ai/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ raceId: selectedRace, classId: selectedClass, style: 'dark fantasy portrait' }),
      });
      if (!genRes.ok) { const err = await genRes.json().catch(() => ({})); throw new Error(err.error || 'Avatar generation failed'); }
      const data = await genRes.json();
      setAvatarUrl(data.url || data.imageUrl || null);
    } catch (err) { setError(err.message); }
    setGenerating(false);
  };

  const handleMintCNFT = async () => {
    if (!avatarUrl) return;
    setMinting(true);
    setMintResult(null);
    try {
      const token = localStorage.getItem('grudge_auth_token');
      if (!token) throw new Error('Sign in to mint');
      const res = await fetch('https://api.grudge-studio.com/api/characters/mint-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl, raceId: selectedRace, classId: selectedClass, spriteFilter: customFilter.trim(), cost: 100 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mint failed');
      setMintResult({ success: true, mintAddress: data.mintAddress });
    } catch (err) { setMintResult({ success: false, error: err.message }); }
    setMinting(false);
  };

  // Slider helper
  const Slider = ({ label, value, onChange, min, max, unit, color }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: MUTED, marginBottom: 2 }}>
        <span>{label}</span><span style={{ color }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', height: 4, accentColor: color || '#ec4899' }} />
    </div>
  );

  return (
    <section>
      <SectionHeading sub="Starting loadout, custom 2D sprite, AI avatar generation & cNFT minting">AVATAR & NFT</SectionHeading>

      {/* Row 1: Race/Class selector + 2D Sprite with coloring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900, margin: '0 auto 20px' }}>
        {/* Left: Selector */}
        <Card accent={race?.color || '#ec4899'}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: race?.color || '#ec4899', fontWeight: 700, marginBottom: 12 }}>
            Select Race & Class
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: '0.65rem', color: MUTED, display: 'block', marginBottom: 3 }}>Race</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {raceList.map(r => (
                <button key={r.id} onClick={() => setSelectedRace(r.id)} style={{
                  padding: '5px 10px', borderRadius: 5, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                  background: selectedRace === r.id ? `${r.color}25` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedRace === r.id ? r.color + '66' : BORDER}`,
                  color: selectedRace === r.id ? r.color : MUTED,
                }}>{r.name}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.65rem', color: MUTED, display: 'block', marginBottom: 3 }}>Class</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {CLASSES.map(c => (
                <button key={c.id} onClick={() => setSelectedClass(c.id)} style={{
                  padding: '5px 10px', borderRadius: 5, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                  background: selectedClass === c.id ? `${c.color}25` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedClass === c.id ? c.color + '66' : BORDER}`,
                  color: selectedClass === c.id ? c.color : MUTED,
                }}>{c.name}</button>
              ))}
            </div>
          </div>
          {/* Sprite coloring sliders */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, marginBottom: 10 }}>
            <div style={{ fontSize: '0.65rem', color: '#ec4899', fontWeight: 700, marginBottom: 6 }}>2D Sprite Coloring</div>
            <Slider label="Hue" value={hue} onChange={setHue} min={0} max={360} unit="°" color="#ec4899" />
            <Slider label="Saturation" value={sat} onChange={setSat} min={0} max={200} unit="%" color="#f59e0b" />
            <Slider label="Brightness" value={bright} onChange={setBright} min={50} max={150} unit="%" color="#60a5fa" />
            {(hue !== 0 || sat !== 100 || bright !== 100) && (
              <button onClick={() => { setHue(0); setSat(100); setBright(100); }} style={{
                fontSize: '0.6rem', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
              }}>Reset colors</button>
            )}
          </div>
          {/* Trait */}
          <div style={{ fontSize: '0.65rem', color: MUTED }}>
            <span style={{ color: race?.color, fontWeight: 600 }}>{race?.trait}</span> · {race?.passive}
          </div>
        </Card>

        {/* Right: 2D Sprite Preview */}
        <Card accent={cls?.color || '#ec4899'}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: cls?.color || '#ec4899', fontWeight: 700, marginBottom: 8 }}>
            2D Sprite · cNFT Avatar
          </div>
          <div style={{
            height: 200, borderRadius: 10,
            background: `radial-gradient(circle at 50% 80%, ${cls?.color || '#fff'}15, transparent 70%)`,
            border: `1px solid ${cls?.color || '#fff'}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}>
            {coloredSprite ? (
              <SpriteAnimation spriteData={coloredSprite} animation="idle" scale={4} speed={150} containerless={false} />
            ) : (
              <div style={{ color: MUTED, fontSize: '0.8rem' }}>No sprite</div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Cinzel', serif", color: race?.color || '#fff', fontSize: '1rem', fontWeight: 700 }}>
              {race?.name} {cls?.name}
            </span>
          </div>
          {/* 3D note */}
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(250,172,71,0.06)', border: '1px solid rgba(250,172,71,0.2)',
            fontSize: '0.6rem', color: MUTED, textAlign: 'center',
          }}>
            This 2D sprite is your cNFT avatar. In 3D game modes, your character is rendered as a <span style={{ color: GOLD_BRIGHT, fontWeight: 700 }}>Grudge6</span> 3D model with matching race, class, and equipment.
          </div>
        </Card>
      </div>

      {/* Row 2: Starting Stats + Equipment + Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 900, margin: '0 auto 20px' }}>
        {/* Starting Attributes */}
        <Card accent="#3b82f6">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700, marginBottom: 10 }}>
            Starting Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {ATTR_KEYS.map(key => {
              const val = startAttrs[key] || 0;
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 8px', borderRadius: 5,
                  background: val > 0 ? `${ATTR_COLORS[key]}10` : 'transparent',
                  border: `1px solid ${val > 0 ? ATTR_COLORS[key] + '33' : 'transparent'}`,
                }}>
                  <span style={{ fontSize: '0.6rem', color: ATTR_COLORS[key], fontWeight: 600 }}>{key.slice(0, 3)}</span>
                  <span style={{ fontSize: '0.7rem', color: '#e8dcc8', fontWeight: 700 }}>{val}</span>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 8, padding: '6px 8px', borderRadius: 6, textAlign: 'center',
            background: 'rgba(250,172,71,0.08)', border: '1px solid rgba(250,172,71,0.2)',
          }}>
            <div style={{ fontSize: '0.55rem', color: MUTED }}>Combat Power</div>
            <div style={{ fontSize: '0.9rem', color: GOLD_BRIGHT, fontWeight: 700 }}>{combatPower}</div>
          </div>
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <span style={{ fontSize: '0.55rem', color: MUTED }}>HP {Math.round(startStats.health)} · MP {Math.round(startStats.mana)} · SP {Math.round(startStats.stamina)}</span>
          </div>
        </Card>

        {/* Starting Equipment */}
        <Card accent="#FAAC47">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#FAAC47', fontWeight: 700, marginBottom: 10 }}>
            Starting Gear
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {EQUIP_SLOT_ORDER.map(slot => {
              const item = equip[slot];
              const isArmor = ['helmet','armor','pants','feet','back'].includes(slot);
              const iconSrc = item
                ? (isArmor ? getArmorIcon(slot, 1) : getWeaponIcon(item.icon))
                : null;
              return (
                <div key={slot} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 8px', borderRadius: 6,
                  background: item ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${item ? BORDER : 'rgba(255,255,255,0.05)'}`,
                  opacity: item ? 1 : 0.35,
                }}>
                  {iconSrc ? (
                    <IconImg src={iconSrc} size={20} />
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: item ? '#e8dcc8' : '#555', fontWeight: 600 }}>
                      {item ? item.name : '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.45rem', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{EQUIP_SLOT_LABELS[slot]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 700 }}>{STARTING_GOLD}g</span>
            <span style={{ fontSize: '0.55rem', color: MUTED }}>starting gold</span>
          </div>
        </Card>

        {/* Starting Inventory */}
        <Card accent="#22c55e">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#22c55e', fontWeight: 700, marginBottom: 10 }}>
            Starting Inventory
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {inventory.map(item => {
              const catColor = item.category === 'tool' ? '#60a5fa'
                : item.category === 'consumable' ? (item.cooldown ? '#a78bfa' : '#22c55e')
                : MUTED;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 8px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                }}>
                  <div>
                    <span style={{ fontSize: '0.6rem', color: '#e8dcc8' }}>{item.name}</span>
                    {item.cooldown && <span style={{ fontSize: '0.45rem', color: '#a78bfa', marginLeft: 4 }}>1hr CD</span>}
                  </div>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                    background: `${catColor}15`, color: catColor,
                  }}>{item.qty ? `x${item.qty}` : item.category}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 3: Avatar Generation + cNFT Mint */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900, margin: '0 auto' }}>
        {/* AI Avatar */}
        <Card accent="#ec4899">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, marginBottom: 10 }}>
            AI Avatar Generation
          </div>
          <div style={{
            height: 200, borderRadius: 10,
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', marginBottom: 12,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Generated avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
            ) : (
              <div style={{ textAlign: 'center', color: MUTED, fontSize: '0.75rem' }}>
                {generating ? 'Generating...' : 'Generate an AI portrait for your character'}
              </div>
            )}
          </div>
          {error && (
            <div style={{ padding: '6px 10px', borderRadius: 5, marginBottom: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.65rem' }}>{error}</div>
          )}
          <button onClick={handleGenerate} disabled={generating} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: generating ? 'rgba(236,72,153,0.15)' : 'linear-gradient(135deg, #ec4899, #db2777)',
            color: '#fff', fontFamily: "'Cinzel', serif", fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: 2, cursor: generating ? 'wait' : 'pointer',
          }}>
            {generating ? 'GENERATING...' : 'GENERATE AVATAR'}
          </button>
        </Card>

        {/* cNFT Mint */}
        <Card accent="#a78bfa">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700, marginBottom: 10 }}>
            Mint cNFT
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 12 }}>
            Mint your 2D sprite avatar (with custom coloring) as a compressed NFT on Solana.
            Your cNFT stores your race, class, starting loadout, and sprite filter.
            In 3D games, it maps to your <span style={{ color: GOLD_BRIGHT, fontWeight: 600 }}>Grudge6</span> character model.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '0.65rem', color: MUTED }}>Cost</div>
            <div style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(250,172,71,0.15)', border: '1px solid rgba(250,172,71,0.3)', color: '#FAAC47', fontSize: '0.75rem', fontWeight: 700 }}>100 GBUX</div>
          </div>
          <button onClick={handleMintCNFT} disabled={!avatarUrl || minting} style={{
            width: '100%', padding: '10px', borderRadius: 8,
            border: '1px solid rgba(139,92,246,0.4)',
            background: !avatarUrl ? 'rgba(255,255,255,0.03)' : minting ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.2))',
            color: !avatarUrl ? '#555' : '#a78bfa',
            fontFamily: "'Cinzel', serif", fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: 1, cursor: !avatarUrl ? 'not-allowed' : minting ? 'wait' : 'pointer',
          }}>
            {minting ? 'MINTING...' : !avatarUrl ? 'GENERATE AVATAR FIRST' : 'MINT cNFT (100 GBUX)'}
          </button>
          {mintResult && (
            <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 5, fontSize: '0.65rem', background: mintResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${mintResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: mintResult.success ? '#22c55e' : '#ef4444' }}>
              {mintResult.success ? `Minted! ${mintResult.mintAddress?.slice(0, 8)}...` : mintResult.error}
            </div>
          )}
        </Card>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)' }}>
        Avatar generation requires VITE_AI_AVATAR_ENABLED=true · cNFT minting requires CROSSMINT_API_KEY and 100 GBUX balance · Sprite color filters are stored on-chain with your cNFT
      </div>
    </section>
  );
}

export default function CharacterPage() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('races');

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('grudge-session') || 'null');
      if (s && s.type && s.username) setSession(s);
    } catch {}
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('grudge-session');
    localStorage.removeItem('grudge_session_token');
    setSession(null);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'races': return <RacesSection />;
      case 'classes': return <ClassesSection />;
      case 'attributes': return <AttributesSection />;
      case 'crafting': return <CraftingSection />;
      case 'island': return <IslandSection />;
      case 'gameplay': return <GameplaySection />;
      case 'avatar': return <AvatarSection />;
      default: return <RacesSection />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: BG, color: '#e8dcc8',
      fontFamily: "'Jost', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <PortalHeader session={session} onSignOut={handleSignOut} />

      {/* Compact Hero Banner */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '28px 24px 16px', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/backgrounds/character_create.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            background: GOLD_GRADIENT, backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: 6, margin: 0,
          }}>
            GRUDGE WARLORDS
          </h1>
          <div style={{ color: MUTED, fontSize: '0.75rem', marginTop: 4 }}>
            6 Races &bull; 4 Classes &bull; 24 Warlords &bull; 15 Weapons &bull; 8 Tiers
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Active Tab Content */}
      <main style={{
        flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto',
        padding: '32px 24px',
      }}>
        {renderTab()}
        <FooterCTAs />
      </main>
    </div>
  );
}

