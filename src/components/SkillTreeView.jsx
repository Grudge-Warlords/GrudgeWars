import React from 'react';
import useGameStore from '../stores/gameStore';
import { skillTrees } from '../data/skillTrees';
import AbilityIcon from './AbilityIcon';

export default function SkillTreeView() {
  const { setScreen, playerClass, level, skillPoints, unlockedSkills, unlockSkill } = useGameStore();
  const tree = skillTrees[playerClass];

  if (!tree) return null;

  const isSkillAvailable = (skill, tier) => {
    if (level < tier.requiredLevel) return false;
    if (skill.requires && !(unlockedSkills[skill.requires] > 0)) return false;
    const current = unlockedSkills[skill.id] || 0;
    if (current >= skill.maxPoints) return false;
    if (skillPoints <= 0) return false;
    return true;
  };

  const isSkillUnlocked = (skillId) => (unlockedSkills[skillId] || 0) > 0;
  const isMaxed = (skill) => (unlockedSkills[skill.id] || 0) >= skill.maxPoints;

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'linear-gradient(180deg, rgba(5,10,21,0.8), rgba(11,16,32,0.75), rgba(20,26,43,0.7))'
    }}>
      <header style={{
        backgroundImage: 'url(/images/ui-panel-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
        borderBottom: `3px solid ${tree.color}`, padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: `0 4px 20px ${tree.color}30`,
      }}>
        <button onClick={() => setScreen('world')} style={{
          background: 'var(--border)', border: 'none', borderRadius: 8,
          padding: '8px 16px', color: 'var(--text)', cursor: 'pointer'
        }}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-cinzel" style={{ color: tree.color, fontSize: '1.2rem' }}>
            {tree.className} Skill Tree
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Level {level}</div>
        </div>
        <div style={{
          background: `rgba(110,231,183,0.1)`, border: '1px solid var(--accent)',
          borderRadius: 8, padding: '6px 14px', textAlign: 'center'
        }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Skill Points</div>
          <div style={{ color: 'var(--accent)', fontSize: '1.3rem', fontWeight: 700 }}>{skillPoints}</div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 30 }}>
        {tree.tiers.map((tier, tierIdx) => {
          const tierLocked = level < tier.requiredLevel;
          return (
            <div key={tierIdx} style={{ marginBottom: 44, position: 'relative' }}>
              {tierIdx > 0 && (
                <div style={{
                  position: 'absolute', top: -24, left: '50%', width: 4, height: 24,
                  background: tierLocked
                    ? 'linear-gradient(180deg, var(--border), rgba(60,60,80,0.3))'
                    : `linear-gradient(180deg, ${tree.color}, ${tree.color}60)`,
                  transform: 'translateX(-50%)',
                  borderRadius: 2,
                  boxShadow: tierLocked ? 'none' : `0 0 8px ${tree.color}50`,
                }} />
              )}
              <div style={{
                textAlign: 'center', marginBottom: 18,
                color: tierLocked ? 'var(--muted)' : 'var(--gold)',
                fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2,
                textShadow: tierLocked ? 'none' : '0 0 12px rgba(255,215,0,0.3)',
              }}>
                {tier.name}
                {tierLocked && <span style={{ color: 'var(--danger)', marginLeft: 8, fontSize: '0.8rem' }}>
                  (Requires Lv.{tier.requiredLevel})
                </span>}
              </div>

              <div style={{
                display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap'
              }}>
                {tier.skills.map(skill => {
                  const available = isSkillAvailable(skill, tier);
                  const unlocked = isSkillUnlocked(skill.id);
                  const maxed = isMaxed(skill);
                  const current = unlockedSkills[skill.id] || 0;
                  const locked = tierLocked || (skill.requires && !isSkillUnlocked(skill.requires));

                  const nodeBg = maxed
                    ? `linear-gradient(145deg, ${tree.color}35 0%, ${tree.color}12 50%, rgba(10,14,30,0.9) 100%)`
                    : unlocked
                    ? 'linear-gradient(145deg, rgba(55,62,100,0.9) 0%, rgba(30,36,65,0.95) 50%, rgba(18,22,45,0.95) 100%)'
                    : 'linear-gradient(145deg, rgba(30,35,58,0.7) 0%, rgba(18,22,40,0.8) 50%, rgba(10,14,28,0.9) 100%)';

                  const borderColor = maxed ? tree.color : unlocked ? 'var(--gold)' : available ? 'var(--accent)' : 'rgba(80,90,120,0.4)';

                  return (
                    <div key={skill.id}
                      onClick={() => available && unlockSkill(skill.id)}
                      style={{
                        background: nodeBg,
                        border: `3px solid ${borderColor}`,
                        borderRadius: 16, padding: 20, width: 210,
                        cursor: available ? 'pointer' : 'default',
                        opacity: locked ? 0.4 : 1, transition: 'all 0.3s ease',
                        textAlign: 'center', position: 'relative',
                        animation: available ? 'glow 2s infinite' : 'none',
                        boxShadow: maxed
                          ? `0 0 20px ${tree.color}40, 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.3)`
                          : unlocked
                          ? `0 0 14px rgba(255,215,0,0.15), 0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.3)`
                          : available
                          ? `0 0 10px rgba(34,211,238,0.12), 0 6px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 4px rgba(0,0,0,0.25)`
                          : `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                      }}
                      onMouseEnter={e => {
                        if (available) {
                          e.currentTarget.style.transform = 'translateY(-5px) scale(1.03)';
                          e.currentTarget.style.boxShadow = `0 0 28px ${tree.color}50, 0 12px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)`;
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 14,
                        background: maxed
                          ? `linear-gradient(180deg, ${tree.color}10 0%, transparent 40%)`
                          : unlocked
                          ? 'linear-gradient(180deg, rgba(255,215,0,0.04) 0%, transparent 40%)'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 30%)',
                        pointerEvents: 'none',
                      }} />

                      <div style={{ marginBottom: 10, position: 'relative' }}>
                        <AbilityIcon ability={skill} size={54} />
                      </div>
                      <div style={{
                        fontWeight: 700, fontSize: '1.05rem',
                        color: maxed ? tree.color : unlocked ? 'var(--gold)' : 'var(--text)',
                        marginBottom: 5,
                        textShadow: unlocked ? '0 0 8px rgba(255,215,0,0.2)' : 'none',
                      }}>
                        {skill.name}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 8, lineHeight: 1.3 }}>
                        {skill.description}
                      </div>
                      <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                        {skill.effect}
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '4px 14px',
                        display: 'inline-block', fontSize: '0.85rem',
                        color: maxed ? tree.color : 'var(--gold)', fontWeight: 700,
                        border: `1px solid ${maxed ? tree.color + '40' : 'rgba(255,215,0,0.15)'}`,
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                      }}>
                        {current}/{skill.maxPoints}
                      </div>
                      {maxed && (
                        <div style={{
                          position: 'absolute', top: -10, right: -10,
                          background: `linear-gradient(135deg, ${tree.color}, ${tree.color}cc)`,
                          borderRadius: '50%',
                          width: 28, height: 28, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700,
                          boxShadow: `0 0 12px ${tree.color}60, 0 2px 6px rgba(0,0,0,0.4)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                        }}>✓</div>
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
  );
}
