import React, { useState, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions, raceList, FACTIONS } from '../data/races';
import { attributeDefinitions } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';
import WorgeMorphPreview from './WorgeMorphPreview';
import { getPlayerSprite, namedHeroes } from '../data/spriteMap';
import { HERO_CREATE_MODAL } from '../constants/layers';

// ── Style constants ──────────────────────────────────────────────────────────
const GOLD = '#d4a96a';
const GOLD_BRIGHT = '#FAAC47';
const GOLD_GRADIENT = 'linear-gradient(90deg, #8B372E 0%, #DB6331 20%, #FAAC47 40%, #FFE0A0 50%, #FAAC47 60%, #DB6331 80%, #8B372E 100%)';
const BG = '#0a0a12';
const BORDER = 'rgba(212,169,106,0.15)';
const MUTED = 'rgba(255,255,255,0.4)';

const STEP_LABELS = ['Race', 'Class', 'Name', 'Attributes', 'Finalize'];

const ATTR_COLORS = {
  Strength: '#ef4444', Vitality: '#22c55e', Endurance: '#6b7280',
  Dexterity: '#f59e0b', Agility: '#06b6d4', Intellect: '#3b82f6',
  Wisdom: '#a855f7', Tactics: '#64748b',
};

const CLASS_PRIMARY_ATTRS = {
  warrior: ['Strength', 'Vitality', 'Endurance'],
  mage:    ['Intellect', 'Wisdom'],
  worge:   ['Strength', 'Agility', 'Vitality'],
  ranger:  ['Dexterity', 'Agility', 'Tactics'],
};

// ── Step Progress Bar ────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        const active = step === s;
        const done = step > s;
        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <div style={{
                width: 48, height: 2,
                background: done ? GOLD_BRIGHT : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? GOLD_BRIGHT : active ? 'rgba(250,172,71,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? GOLD_BRIGHT : active ? GOLD_BRIGHT : 'rgba(255,255,255,0.1)'}`,
                color: done ? '#0a0a12' : active ? GOLD_BRIGHT : MUTED,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.7rem', transition: 'all 0.3s',
                fontFamily: "'Cinzel', serif",
              }}>
                {done ? '✓' : s}
              </div>
              <span style={{
                color: active ? '#fff' : done ? GOLD : MUTED,
                fontSize: '0.65rem', fontWeight: active ? 700 : 400,
                fontFamily: "'Cinzel', serif", letterSpacing: 1,
                textTransform: 'uppercase',
              }}>{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Race Card (matching crafting suite style) ────────────────────────────────
function RaceCard({ race, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const faction = FACTIONS[race.faction];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        borderRadius: 12,
        border: `2px solid ${isSelected ? GOLD_BRIGHT : hovered ? 'rgba(212,169,106,0.4)' : 'rgba(212,169,106,0.15)'}`,
        background: '#111118',
        transition: 'all 0.3s',
        transform: isSelected ? 'scale(1.02)' : hovered ? 'translateY(-3px)' : 'none',
        boxShadow: isSelected
          ? `0 0 25px rgba(250,172,71,0.2), inset 0 0 40px rgba(250,172,71,0.05)`
          : hovered ? '0 8px 30px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Equipment BG silhouette */}
      <div style={{
        position: 'relative', width: '100%', paddingTop: '120%',
        overflow: 'hidden',
      }}>
        <img
          src={race.equipBg}
          alt={race.name}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 80%, rgba(17,17,24,1) 100%)',
        }} />

        {/* GRUDGE WARLORD banner */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          textAlign: 'center', padding: '6px 0 2px',
        }}>
          <div style={{
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            fontSize: 'clamp(0.55rem, 1.5vw, 0.7rem)',
            background: GOLD_GRADIENT, backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: 3,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
          }}>
            GRUDGE WARLORD
          </div>
          {/* Faction tag */}
          {faction && (
            <div style={{
              position: 'absolute', top: 2, right: 6,
              fontSize: '0.5rem', fontWeight: 700,
              color: faction.color, letterSpacing: 1,
              textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            }}>
              {faction.name}
            </div>
          )}
        </div>

        {/* Race name over silhouette */}
        <div style={{
          position: 'absolute', top: 22, left: 0, right: 0,
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
            color: '#fff', fontWeight: 700, letterSpacing: 2,
            textShadow: '0 2px 6px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,0,0.4)',
            padding: '4px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            {race.name.toUpperCase()}
          </div>
        </div>

        {/* Selected check */}
        {isSelected && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            width: 22, height: 22, borderRadius: '50%',
            background: GOLD_BRIGHT, color: '#0a0a12',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.7rem',
          }}>✓</div>
        )}
      </div>

      {/* Bottom info */}
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{
          fontFamily: "'LifeCraft', 'Cinzel', serif",
          fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
          color: '#e8dcc8', letterSpacing: 2, marginBottom: 4,
        }}>
          {race.name}
        </div>
        <div style={{
          fontSize: '0.7rem', color: MUTED, lineHeight: 1.5,
          marginBottom: 10, minHeight: 32,
          textTransform: 'uppercase', letterSpacing: 0.5,
          fontFamily: "'Cinzel', serif",
        }}>
          {race.shortDesc || race.description}
        </div>

        {/* Attribute bonus pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(race.topBonuses || []).map((bonus, i) => {
            const attrName = Object.keys(ATTR_COLORS).find(a => bonus.includes(a.slice(0, 3)));
            const color = attrName ? ATTR_COLORS[attrName] : GOLD;
            return (
              <span key={i} style={{
                padding: '2px 8px', borderRadius: 4,
                background: `${color}18`, border: `1px solid ${color}40`,
                color, fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: 0.5,
              }}>
                {bonus}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom glow when selected */}
      {isSelected && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${GOLD_BRIGHT} 30%, ${GOLD_BRIGHT} 70%, transparent)`,
        }} />
      )}
    </div>
  );
}

// ── Class Card ───────────────────────────────────────────────────────────────
function ClassCard({ cls, clsId, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const primaryAttrs = CLASS_PRIMARY_ATTRS[clsId] || [];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        borderRadius: 12, padding: 20,
        border: `2px solid ${isSelected ? cls.color : hovered ? cls.color + '60' : 'rgba(212,169,106,0.15)'}`,
        background: isSelected
          ? `linear-gradient(180deg, ${cls.color}12, rgba(17,17,24,0.95))`
          : '#111118',
        transition: 'all 0.3s',
        transform: hovered && !isSelected ? 'translateY(-3px)' : 'none',
        boxShadow: isSelected ? `0 0 20px ${cls.color}20` : 'none',
        textAlign: 'center',
      }}
    >
      {/* Class icon */}
      <div style={{
        width: 64, height: 64, margin: '0 auto 12px',
        borderRadius: '50%', overflow: 'hidden',
        background: `radial-gradient(circle, ${cls.color}20, transparent)`,
        border: `2px solid ${cls.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={`/sprites/ui/icons/icon_${clsId}.png`}
          alt={cls.name}
          style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '1rem',
        color: cls.color, fontWeight: 700, marginBottom: 8,
      }}>
        {cls.name}
      </div>

      <div style={{
        fontSize: '0.75rem', color: MUTED, lineHeight: 1.5,
        marginBottom: 12, minHeight: 48,
      }}>
        {cls.description}
      </div>

      {/* Primary attributes */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {primaryAttrs.map(attr => (
          <span key={attr} style={{
            padding: '3px 10px', borderRadius: 4,
            background: `${ATTR_COLORS[attr]}15`, border: `1px solid ${ATTR_COLORS[attr]}40`,
            color: ATTR_COLORS[attr], fontSize: '0.65rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {attr}
          </span>
        ))}
      </div>

      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: cls.color, color: '#0a0a12',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.7rem',
        }}>✓</div>
      )}
    </div>
  );
}

// ── Navigation buttons ───────────────────────────────────────────────────────
function NavButton({ onClick, label, primary, disabled, color }) {
  const [hovered, setHovered] = useState(false);
  const bg = primary
    ? (disabled ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${color || '#DB6331'}, ${color ? color + 'cc' : '#FAAC47'})`)
    : 'rgba(255,255,255,0.04)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 36px', borderRadius: 10,
        background: bg,
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.1)',
        color: primary && !disabled ? '#0a0a12' : disabled ? 'rgba(255,255,255,0.2)' : '#e8dcc8',
        fontWeight: 700, fontSize: '0.9rem',
        fontFamily: "'Cinzel', serif", letterSpacing: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
        transform: hovered && !disabled ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && primary && !disabled ? '0 4px 16px rgba(250,172,71,0.25)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function CharacterCreate() {
  const {
    setScreen, setPlayerName, selectRace, selectClass,
    playerClass, playerRace, playerName,
    attributePoints, baseAttributePoints, unspentPoints, allocatePoint, deallocatePoint, startGame,
  } = useGameStore();

  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [detectedNamedHero, setDetectedNamedHero] = useState(null);
  const [showUnlockCinematic, setShowUnlockCinematic] = useState(false);
  const [cinematicFading, setCinematicFading] = useState(false);
  const videoRef = useRef(null);
  const cinematicFinishing = useRef(false);

  const checkSecretUnlock = (raceId, classId) => {
    const currentName = playerName || nameInput.trim();
    if (!currentName || !raceId || !classId) return null;
    const heroName = currentName.toLowerCase().replace(/\s+/g, ' ');
    const matched = Object.keys(namedHeroes).find(key => {
      const nh = namedHeroes[key];
      const matchName = (nh.unlockName || nh.name).toLowerCase().replace(/\s+/g, ' ');
      return nh.race === raceId && nh.class === classId && nh.unlocked && heroName === matchName;
    });
    return matched || null;
  };

  // Step handlers
  const handleRaceSelect = () => {
    if (selectedRace) {
      selectRace(selectedRace);
      setStep(2);
    }
  };

  const handleClassSelect = () => {
    if (selectedClass) {
      selectClass(selectedClass);
      setStep(3);
    }
  };

  const handleNameConfirm = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      const matched = checkSecretUnlock(selectedRace, selectedClass);
      if (matched) {
        setDetectedNamedHero(matched);
        setShowUnlockCinematic(true);
      }
      setStep(4);
    }
  };

  const handleFinalize = () => {
    if (playerClass) startGame(detectedNamedHero || null);
  };

  const goBack = (toStep) => {
    if (toStep <= 2) {
      setSelectedClass(null);
      selectClass(null);
      setDetectedNamedHero(null);
    }
    if (toStep <= 1) {
      setSelectedRace(null);
      selectRace(null);
    }
    setStep(toStep);
  };

  const finishCinematic = () => {
    if (cinematicFinishing.current) return;
    cinematicFinishing.current = true;
    setCinematicFading(true);
    setTimeout(() => {
      setShowUnlockCinematic(false);
      setCinematicFading(false);
      cinematicFinishing.current = false;
    }, 800);
  };

  const selectedRaceDef = selectedRace ? raceDefinitions[selectedRace] : null;
  const selectedClsDef = selectedClass ? classDefinitions[selectedClass] : null;
  const nhData = detectedNamedHero ? namedHeroes[detectedNamedHero] : null;

  // ── Secret hero cinematic ──────────────────────────────────────────────
  if (showUnlockCinematic && nhData) {
    const videoSrc = nhData.unlockVideo || '/videos/hero_creation_cinematic.mp4';
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: HERO_CREATE_MODAL,
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: cinematicFading ? 0 : 1, transition: 'opacity 0.8s ease-out',
      }}>
        <video ref={videoRef} src={videoSrc} autoPlay muted playsInline
          onEnded={finishCinematic} onError={finishCinematic}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: 0, right: 0,
          textAlign: 'center', animation: 'fadeIn 1.5s ease forwards', pointerEvents: 'none',
        }}>
          <div className="font-lifecraft" style={{
            fontSize: '2.5rem', color: nhData.color || 'var(--gold)',
            textShadow: `0 0 30px ${nhData.color || 'var(--gold)'}60`,
            letterSpacing: 4, marginBottom: 8,
          }}>SECRET HERO UNLOCKED</div>
          <div className="font-cinzel" style={{ fontSize: '1.8rem', color: '#fff' }}>{nhData.fullName}</div>
        </div>
        <button onClick={finishCinematic} style={{
          position: 'absolute', bottom: 30, right: 30,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, padding: '8px 20px', color: '#fff', cursor: 'pointer',
        }}>Skip</button>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: BG, position: 'relative',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/backgrounds/character_create.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.15, pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,18,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`, padding: '16px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
          {/* Logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/sprites/ui/grudge_logo.png" alt="" style={{ width: 32, height: 32 }} onError={e => e.target.style.display = 'none'} />
            <div>
              <div style={{
                fontFamily: "'LifeCraft', 'Cinzel', serif",
                fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                background: GOLD_GRADIENT, backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: 4,
              }}>CHARACTER CREATION</div>
              <div style={{ fontSize: '0.6rem', color: MUTED, letterSpacing: 2, textTransform: 'uppercase' }}>
                Forge your legend in the world of Grudge
              </div>
            </div>
          </div>

          {/* Step bar */}
          <StepBar step={step} />
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {/* ═══ STEP 1: RACE ═══ */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}>
              {raceList.map(race => (
                <RaceCard
                  key={race.id}
                  race={race}
                  isSelected={selectedRace === race.id}
                  onClick={() => setSelectedRace(race.id)}
                />
              ))}
            </div>

            {/* Lore box */}
            {selectedRaceDef && (
              <div style={{
                marginTop: 20, padding: 16, borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${selectedRaceDef.color}30`,
                textAlign: 'center',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  &ldquo;{selectedRaceDef.lore}&rdquo;
                </p>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <NavButton onClick={() => setScreen('lobby')} label="← CANCEL" />
              <NavButton onClick={handleRaceSelect} label="CONTINUE →" primary disabled={!selectedRace} />
            </div>
          </div>
        )}

        {/* ═══ STEP 2: CLASS ═══ */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{
                fontFamily: "'LifeCraft', 'Cinzel', serif",
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                background: GOLD_GRADIENT, backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: 4, margin: '0 0 6px',
              }}>GRUDGE WARLORDS</h2>
              <div style={{ color: MUTED, fontSize: '0.85rem' }}>Choose your class</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}>
              {Object.entries(classDefinitions).map(([id, cls]) => (
                <ClassCard
                  key={id}
                  cls={cls}
                  clsId={id}
                  isSelected={selectedClass === id}
                  onClick={() => setSelectedClass(id)}
                />
              ))}
            </div>

            {/* Class lore */}
            {selectedClsDef && (
              <div style={{
                marginTop: 20, padding: 16, borderRadius: 10,
                background: `${selectedClsDef.color}08`, border: `1px solid ${selectedClsDef.color}30`,
                textAlign: 'center',
              }}>
                <p style={{ color: selectedClsDef.color, fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  &ldquo;{selectedClsDef.lore}&rdquo;
                </p>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <NavButton onClick={() => goBack(1)} label="← BACK" />
              <NavButton onClick={handleClassSelect} label="CONTINUE →" primary disabled={!selectedClass} color={selectedClsDef?.color} />
            </div>
          </div>
        )}

        {/* ═══ STEP 3: NAME ═══ */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center', paddingTop: 20 }}>
            <h2 style={{
              fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: '1.6rem',
              background: GOLD_GRADIENT, backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: 4, marginBottom: 8,
            }}>NAME YOUR WARLORD</h2>

            {/* Race + Class badge */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {selectedRaceDef && (
                <span style={{
                  background: `${selectedRaceDef.color}15`, border: `1px solid ${selectedRaceDef.color}40`,
                  padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', color: selectedRaceDef.color,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <img src={selectedRaceDef.icon} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />
                  {selectedRaceDef.name}
                </span>
              )}
              {selectedClsDef && (
                <span style={{
                  background: `${selectedClsDef.color}15`, border: `1px solid ${selectedClsDef.color}40`,
                  padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', color: selectedClsDef.color,
                }}>
                  {selectedClsDef.name}
                </span>
              )}
            </div>

            {/* Character preview */}
            <div style={{
              width: 140, height: 160, margin: '0 auto 24px',
              borderRadius: 14, overflow: 'hidden',
              background: `radial-gradient(circle at 50% 80%, ${selectedClsDef?.color || '#333'}20, transparent)`,
              border: `1px solid ${selectedClsDef?.color || '#333'}30`,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}>
              {selectedClass === 'worge' ? (
                <WorgeMorphPreview raceId={selectedRace} scale={2.5} speed={150} />
              ) : (
                <SpriteAnimation spriteData={getPlayerSprite(selectedClass, selectedRace)} animation="idle" scale={2.5} speed={150} containerless={false} />
              )}
            </div>

            <input
              type="text" value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameConfirm()}
              placeholder="Enter your name..."
              maxLength={20} autoFocus
              style={{
                background: 'rgba(255,255,255,0.04)', border: `2px solid ${BORDER}`,
                borderRadius: 10, padding: '14px 28px', fontSize: '1.2rem',
                color: '#e8dcc8', textAlign: 'center', width: 360,
                outline: 'none', fontFamily: "'Jost', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = GOLD_BRIGHT}
              onBlur={e => e.target.style.borderColor = 'rgba(212,169,106,0.15)'}
            />

            <div style={{ textAlign: 'center', marginTop: 28, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <NavButton onClick={() => goBack(2)} label="← BACK" />
              <NavButton onClick={handleNameConfirm} label="CONTINUE →" primary disabled={!nameInput.trim()} />
            </div>
          </div>
        )}

        {/* ═══ STEP 4: ATTRIBUTES ═══ */}
        {step === 4 && playerClass && (() => {
          const cls = classDefinitions[playerClass];
          const raceDef = playerRace ? raceDefinitions[playerRace] : null;
          return (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Summary bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
                borderRadius: 14, padding: 18, flexWrap: 'wrap', justifyContent: 'center',
              }}>
                <div style={{
                  width: 80, height: 90, borderRadius: 10, overflow: 'hidden',
                  background: `radial-gradient(circle, ${cls.color}15, transparent)`,
                  border: `1px solid ${cls.color}30`,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0,
                }}>
                  <SpriteAnimation spriteData={nhData ? nhData.sprite : getPlayerSprite(playerClass, playerRace)} animation="idle" scale={1.5} speed={150} containerless={false} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 className="font-cinzel" style={{ color: GOLD_BRIGHT, fontSize: '1.1rem', margin: '0 0 4px' }}>
                    {nhData ? nhData.fullName : playerName}
                  </h3>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                    {raceDef && <span style={{ background: `${raceDef.color}15`, border: `1px solid ${raceDef.color}40`, padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', color: raceDef.color }}>{raceDef.name}</span>}
                    <span style={{ background: `${cls.color}15`, border: `1px solid ${cls.color}40`, padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', color: cls.color }}>{cls.name}</span>
                  </div>
                  <div style={{
                    background: unspentPoints === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(250,172,71,0.12)',
                    border: `2px solid ${unspentPoints === 0 ? '#10b981' : GOLD_BRIGHT}`,
                    borderRadius: 8, padding: '4px 16px', display: 'inline-block',
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: unspentPoints === 0 ? '#10b981' : GOLD_BRIGHT }}>{unspentPoints}</span>
                    <span style={{ color: MUTED, fontSize: '0.7rem', marginLeft: 6 }}>points to allocate</span>
                  </div>
                </div>
              </div>

              {/* Attribute grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {Object.entries(attributeDefinitions).map(([name, def]) => {
                  const base = (baseAttributePoints && baseAttributePoints[name]) || 0;
                  const current = attributePoints[name];
                  const added = current - base;
                  const canRemove = current > base;
                  return (
                    <div key={name} style={{
                      background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
                      borderRadius: 10, padding: 12, borderLeft: `4px solid ${def.color}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img src={def.icon} alt={name} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
                          <span style={{ color: def.color }}>{name}</span>
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                          <span style={{ color: MUTED }}>{base}</span>
                          {added > 0 && <span style={{ color: '#6ee7b7', fontWeight: 700 }}> +{added}</span>}
                          <span style={{ color: '#e8dcc8', fontWeight: 700, marginLeft: 6 }}>= {current}</span>
                        </span>
                      </div>
                      <div style={{ color: MUTED, fontSize: '0.68rem', marginBottom: 6 }}>{def.description}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => deallocatePoint(name)} style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: canRemove ? '#ef4444' : 'rgba(255,255,255,0.05)',
                          border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem',
                          cursor: canRemove ? 'pointer' : 'not-allowed', opacity: canRemove ? 1 : 0.3,
                        }}>-</button>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${(base / 20) * 100}%`, height: '100%',
                            background: `${def.color}40`, borderRadius: 3, position: 'absolute',
                          }} />
                          <div style={{
                            width: `${(current / 20) * 100}%`, height: '100%',
                            background: `linear-gradient(90deg, ${def.color}, ${def.color}99)`,
                            borderRadius: 3, transition: 'width 0.2s', position: 'relative',
                          }} />
                        </div>
                        <button onClick={() => allocatePoint(name)} style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: unspentPoints > 0 ? '#10b981' : 'rgba(255,255,255,0.05)',
                          border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem',
                          cursor: unspentPoints > 0 ? 'pointer' : 'not-allowed', opacity: unspentPoints > 0 ? 1 : 0.3,
                        }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
                <NavButton onClick={() => goBack(3)} label="← BACK" />
                <NavButton onClick={() => setStep(5)} label="FINALIZE →" primary />
              </div>
            </div>
          );
        })()}

        {/* ═══ STEP 5: FINALIZE ═══ */}
        {step === 5 && playerClass && (() => {
          const cls = classDefinitions[playerClass];
          const raceDef = playerRace ? raceDefinitions[playerRace] : null;
          const faction = raceDef ? FACTIONS[raceDef.faction] : null;
          return (
            <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center', paddingTop: 20 }}>
              <h2 style={{
                fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: '1.8rem',
                background: GOLD_GRADIENT, backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: 6, marginBottom: 6,
              }}>YOUR WARLORD</h2>

              {faction && (
                <div style={{
                  fontSize: '0.7rem', color: faction.color, letterSpacing: 3,
                  textTransform: 'uppercase', fontWeight: 700, marginBottom: 20,
                }}>
                  {faction.name} Faction
                </div>
              )}

              {/* Character preview with equipment BG */}
              <div style={{
                width: 280, height: 340, margin: '0 auto 24px',
                borderRadius: 14, overflow: 'hidden', position: 'relative',
                border: `2px solid ${BORDER}`,
              }}>
                {raceDef && (
                  <img src={raceDef.equipBg} alt="" style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                  }} />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 30%, rgba(10,10,18,0.8) 100%)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 2,
                }}>
                  <SpriteAnimation spriteData={nhData ? nhData.sprite : getPlayerSprite(playerClass, playerRace)} animation="idle" scale={3} speed={150} containerless={false} />
                </div>

                {/* GRUDGE WARLORD banner */}
                <div style={{
                  position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', zIndex: 2,
                }}>
                  <div style={{
                    fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: '0.7rem',
                    background: GOLD_GRADIENT, backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: 3,
                  }}>GRUDGE WARLORD</div>
                </div>

                {/* Name + info at bottom */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px',
                  background: 'rgba(10,10,18,0.85)', zIndex: 2,
                  borderTop: `1px solid ${BORDER}`,
                }}>
                  <div className="font-cinzel" style={{ color: GOLD_BRIGHT, fontSize: '1rem', fontWeight: 700 }}>
                    {nhData ? nhData.fullName : playerName}
                  </div>
                  <div style={{ color: MUTED, fontSize: '0.7rem' }}>
                    {raceDef?.name} {cls?.name}
                  </div>
                </div>
              </div>

              {/* Attribute summary */}
              <div style={{
                display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28,
              }}>
                {Object.entries(attributePoints).map(([name, val]) => {
                  if (!val) return null;
                  const def = attributeDefinitions[name];
                  return (
                    <div key={name} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                    }}>
                      <img src={def?.icon} alt="" style={{ width: 18, height: 18, imageRendering: 'pixelated' }} />
                      <span style={{ color: def?.color, fontSize: '0.7rem', fontWeight: 700 }}>{val}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <NavButton onClick={() => goBack(4)} label="← BACK" />
                <NavButton onClick={handleFinalize} label="BEGIN ADVENTURE" primary />
              </div>
            </div>
          );
        })()}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
