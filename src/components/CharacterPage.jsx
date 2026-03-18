import React, { useState, useEffect } from 'react';
import PortalHeader from './portal/PortalHeader';
import SpriteAnimation from './SpriteAnimation';
import { raceDefinitions, raceList } from '../data/races';
import { classDefinitions } from '../data/classes';
import { attributeDefinitions } from '../data/attributes';
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

// ── Shared style constants (matches StudioPortal) ──
const GOLD = '#d4a96a';
const GOLD_BRIGHT = '#FAAC47';
const GOLD_GRADIENT = 'linear-gradient(90deg, #DB6331, #FAAC47, #FFE0A0, #FAAC47, #DB6331)';
const BG = '#0a0a12';
const PANEL = 'rgba(255,255,255,0.02)';
const BORDER = 'rgba(212,169,106,0.15)';
const MUTED = 'rgba(255,255,255,0.4)';

// ── Data ──
const CLASSES = Object.entries(classDefinitions).map(([id, def]) => ({ id, ...def }));

const PROFESSIONS = [
  { key: 'Miner',    color: '#ef4444', role: 'Metal · Weapons · Armor',       desc: 'Extract ore and stone from the depths. Smelt ingots and forge deadly weapons and armor.' },
  { key: 'Forester', color: '#22c55e', role: 'Wood · Bows · Leather',         desc: 'Harvest timber and tan hides. Craft bows, crossbows, and leather armor.' },
  { key: 'Mystic',   color: '#a78bfa', role: 'Cloth · Staves · Enchants',     desc: 'Gather arcane dust and weave cloth. Create staves, tomes, and enchanted gear.' },
  { key: 'Chef',     color: '#f59e0b', role: 'Food · Potions · Buffs',        desc: 'Cook hearty meals and brew potions that grant powerful combat buffs.' },
  { key: 'Engineer', color: '#60a5fa', role: 'Guns · Crossbows · Traps',      desc: 'Assemble precision mechanisms. Build firearms, crossbows, and tactical traps.' },
];

const BUILDINGS = [
  { type: 'camp',     emoji: '⛺', label: 'Camp',        desc: 'Claim your island and establish a foothold.' },
  { type: 'mine',     emoji: '⛏️', label: 'Mine',        desc: 'Produces ore and stone passively.' },
  { type: 'lumber',   emoji: '🪓', label: 'Lumber Mill', desc: 'Produces wood from the surrounding forest.' },
  { type: 'herb',     emoji: '🌿', label: 'Herb Garden', desc: 'Grows herbs for potions and enchanting.' },
  { type: 'kitchen',  emoji: '🍳', label: 'Kitchen',     desc: 'Cooks food to keep your heroes fed.' },
  { type: 'workshop', emoji: '🔧', label: 'Workshop',    desc: 'Produces crystals and refined parts.' },
  { type: 'farm',     emoji: '🌾', label: 'Farm',        desc: 'Grows crops for sustenance and trade.' },
];

const RANK_TIERS = [
  { name: 'Bronze',   wins: '0+',  color: '#cd7f32' },
  { name: 'Silver',   wins: '5+',  color: '#c0c0c0' },
  { name: 'Gold',     wins: '10+', color: '#ffd700' },
  { name: 'Platinum', wins: '20+', color: '#6ee7b7' },
  { name: 'Diamond',  wins: '35+', color: '#60a5fa' },
  { name: 'Legend',   wins: '50+', color: '#f59e0b' },
];

// ── Reusable sub-components ──

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

// ── Section: Races ──

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

// ── Section: Classes ──

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

// ── Section: Attributes ──

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

// ── Section: Crafting & Professions ──

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
                  : <span style={{ fontSize: 28 }}>⚒️</span>}
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

// ── Section: Home Island & AFK Harvesting ──

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
                🏝️ Your Personal Island
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

// ── Section: Gameplay / Arena ──

function GameplaySection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading sub="Turn-based combat, ranked arena PvP, and epic loot">GRUDGE WARS GAMEPLAY</SectionHeading>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Combat */}
        <Card accent="#ef4444">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>
            ⚔️ Turn-Based Combat
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Build a party of up to 3 heroes. Each class plays differently — Warriors tank and cleave,
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
            🏆 Ranked Arena
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
            🛡️ Equipment & Loot
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

// ── Footer CTAs ──

function FooterCTAs() {
  return (
    <section style={{ textAlign: 'center', padding: '32px 0 20px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <CtaButton href="/play" primary>PLAY NOW</CtaButton>
        <CtaButton href={BUILDER_URL + '/character'}>BUILD A CHARACTER</CtaButton>
        <CtaButton href="https://discord.gg/KmAC5aXs84">JOIN DISCORD</CtaButton>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
        &copy; 2026 Grudge Studio &mdash; All Rights Reserved
      </div>
    </section>
  );
}

// ══════════════════════════════════════════
// MAIN CHARACTER PAGE
// ══════════════════════════════════════════

export default function CharacterPage() {
  const [session, setSession] = useState(null);

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

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: BG, color: '#e8dcc8',
      fontFamily: "'Jost', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <PortalHeader session={session} onSignOut={handleSignOut} />

      {/* Hero Banner */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '48px 24px 40px', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/backgrounds/character_create.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,10,18,0.3) 0%, rgba(10,10,18,0.95) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
            background: GOLD_GRADIENT, backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: 6, margin: '0 0 8px',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
          }}>
            CHARACTERS OF THE GRUDGE WARS
          </h1>
          <div style={{ color: MUTED, fontSize: '0.9rem', maxWidth: 550, margin: '0 auto' }}>
            6 Races &bull; 4 Classes &bull; 5 Professions &bull; 8 Attributes &bull; Islands &bull; AFK Harvesting &bull; Ranked Arena
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{
        flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto',
        padding: '32px 24px',
      }}>
        <RacesSection />
        <ClassesSection />
        <AttributesSection />
        <CraftingSection />
        <IslandSection />
        <GameplaySection />
        <FooterCTAs />
      </main>
    </div>
  );
}
