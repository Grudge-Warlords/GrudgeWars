import React, { useState } from 'react';

const LINKS = [
  { label: 'GrudaWars',        desc: 'Lead your warlords into battle',  href: 'https://grudgewarlords.com',                       color: '#DB6331', bg: '/backgrounds/battle_arena_default.png', external: true },
  { label: 'Character Builder', desc: 'Create & manage characters',     href: 'https://client.grudge-studio.com/character',        color: '#FAAC47', bg: '/backgrounds/character_create.png' },
  { label: 'Crafting Suite',   desc: 'Forge weapons & armor',           href: 'https://warlord-crafting-suite.vercel.app',         color: '#6ee7b7', bg: '/backgrounds/camp_shop.png', external: true },
  { label: 'Arena',            desc: 'Ranked PvP battles',              href: '/play#arena',                                       color: '#3b82f6', bg: '/backgrounds/arena.png' },
  { label: 'World Map',        desc: 'Explore 30+ zones',               href: '/play#world',                                       color: '#22d3ee', bg: '/backgrounds/world_map.png' },
  { label: 'Home Island',      desc: 'Build & harvest resources',       href: '/play#island',                                      color: '#4ade80', bg: '/backgrounds/grass_field.png' },
  { label: 'Discord',          desc: 'Join the community',              href: 'https://discord.gg/FtGtmxmwkh',                    color: '#5865F2', bg: '/backgrounds/hall_of_odin.png', external: true },
];

function LinkCard({ link }) {
  const [hovered, setHovered] = useState(false);
  const isExternal = link.external || link.href.startsWith('http');

  return (
    <a
      href={link.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      style={{
        textDecoration: 'none',
        position: 'relative', overflow: 'hidden',
        borderRadius: 10, padding: 0,
        display: 'flex', flexDirection: 'column',
        border: `1px solid ${hovered ? link.color + '55' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.25s', cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 30px ${link.color}15` : '0 2px 10px rgba(0,0,0,0.2)',
        minHeight: 90,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background art */}
      {link.bg && (
        <div style={{
          position: 'absolute', inset: 0,
        }}>
          <img
            src={link.bg} alt="" loading="lazy"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: hovered ? 'saturate(1) brightness(0.5)' : 'saturate(0.6) brightness(0.3)',
              transition: 'all 0.4s',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, rgba(10,10,18,0.7), rgba(10,10,18,0.85) 60%, ${link.color}08 100%)`,
          }} />
        </div>
      )}
      {!link.bg && (
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        }} />
      )}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: link.color, flexShrink: 0,
          boxShadow: hovered ? `0 0 12px ${link.color}88` : `0 0 4px ${link.color}44`,
          transition: 'box-shadow 0.2s',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.8rem',
            color: hovered ? link.color : '#e8dcc8', fontWeight: 600,
            transition: 'color 0.2s',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>
            {link.label}
          </div>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.5)', marginTop: 2,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}>
            {link.desc}
          </div>
        </div>
        {isExternal && (
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>↗</span>
        )}
      </div>
    </a>
  );
}

export default function QuickLinks() {
  return (
    <div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '0.85rem',
        color: '#d4a96a', fontWeight: 600, letterSpacing: 2,
        marginBottom: 12, textTransform: 'uppercase',
      }}>
        Grudge Studio
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 10,
      }}>
        {LINKS.map(link => <LinkCard key={link.label} link={link} />)}
      </div>
    </div>
  );
}

