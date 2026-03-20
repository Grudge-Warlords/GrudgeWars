import React, { useState, useEffect, useRef, useCallback } from 'react';
import GKOBoxing from './GKOBoxing';

const ARENA_BG = '/sprites/arena-pack/3 Background/Night/BackgroundNight.png';
const ARENA_BG_DAY = '/sprites/arena-pack/3 Background/Day/BackgroundDay.png';

const FONT = "'Press Start 2P', monospace";

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN LADDER
// ═══════════════════════════════════════════════════════════════════════
const OPPONENTS = [
  { name: 'ROOKIE',        difficulty: 0.5, color: '#48bb78', desc: 'A nervous newcomer. Slow and predictable.' },
  { name: 'BRAWLER',       difficulty: 0.75, color: '#f6ad55', desc: 'Tough but sloppy. Hits hard, guards rarely.' },
  { name: 'STRIKER',       difficulty: 1.0, color: '#ed8936', desc: 'Fast combos. Watch for the 1-2 setup.' },
  { name: 'CHAMPION',      difficulty: 1.3, color: '#e53e3e', desc: 'Defensive master. Blocks everything, counters hard.' },
  { name: 'G.K.O. CHAMP',  difficulty: 1.6, color: '#a855f7', desc: 'The underground king. Specials. Combos. No mercy.' },
];

// ═══════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════
const panelBg = 'linear-gradient(180deg, rgba(15,12,25,0.95), rgba(10,8,18,0.98))';
const goldBorder = '1px solid rgba(255,215,0,0.25)';

function StatBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ color: '#aaa', fontFamily: FONT, fontSize: '0.45rem' }}>{label}</span>
        <span style={{ color, fontFamily: FONT, fontSize: '0.45rem' }}>{value}/{max}</span>
      </div>
      <div style={{ width: '100%', height: 10, background: '#1a1a2e', border: '1px solid #333', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, color = '#ffd700', disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#333' : `linear-gradient(135deg, ${color}, ${color}cc)`,
      border: disabled ? '1px solid #555' : `2px solid ${color}`,
      borderRadius: 8, padding: '10px 24px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: FONT, fontSize: '0.6rem', color: disabled ? '#666' : '#000',
      letterSpacing: 1, boxShadow: disabled ? 'none' : `0 4px 16px ${color}40`,
      transition: 'transform 0.1s',
    }}>{children}</button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STRENGTH TRAINING — Sandbag Punch Slider
// ═══════════════════════════════════════════════════════════════════════
function StrengthTraining({ onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready, charging, result
  const [sliderPos, setSliderPos] = useState(0); // 0-100
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => { containerRef.current?.focus(); }, [phase]);

  useEffect(() => {
    if (phase !== 'charging') { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    posRef.current = 0;
    dirRef.current = 1;
    intervalRef.current = setInterval(() => {
      posRef.current += dirRef.current * 2.5;
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
      setSliderPos(posRef.current);
    }, 20);
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  const handleKey = useCallback((e) => {
    if (e.key.toLowerCase() !== 'j') return;
    if (phase === 'ready') { setPhase('charging'); return; }
    if (phase === 'charging') {
      clearInterval(intervalRef.current);
      const pos = posRef.current;
      // Green zone: 40-60, Yellow: 25-40 and 60-75, Red: rest
      let gained = 0;
      if (pos >= 42 && pos <= 58) gained = 5;
      else if (pos >= 30 && pos <= 70) gained = 3;
      else if (pos >= 20 && pos <= 80) gained = 1;
      setResult({ pos, gained });
      setPhase('result');
    }
  }, [phase]);

  const getZoneColor = (pos) => {
    if (pos >= 42 && pos <= 58) return '#22c55e';
    if (pos >= 30 && pos <= 70) return '#eab308';
    return '#ef4444';
  };

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKey} style={{
      width: '100%', height: '100%', position: 'relative', outline: 'none',
      backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 500, width: '90%' }}>
        <h2 style={{ fontFamily: FONT, color: '#ffd700', fontSize: '1rem', marginBottom: 20, textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
          STRENGTH TRAINING
        </h2>

        {/* Punching bag visual */}
        <div style={{ fontSize: '4rem', marginBottom: 20, filter: phase === 'result' && result?.gained >= 3 ? 'hue-rotate(90deg)' : 'none', transition: 'filter 0.3s' }}>
          🥊
        </div>

        {/* Slider */}
        <div style={{ position: 'relative', width: '100%', height: 40, background: '#1a1a2e', border: '2px solid #444', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
          {/* Color zones */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ width: '20%', background: 'rgba(239,68,68,0.3)' }} />
            <div style={{ width: '10%', background: 'rgba(234,179,8,0.3)' }} />
            <div style={{ width: '12%', background: 'rgba(234,179,8,0.2)' }} />
            <div style={{ width: '16%', background: 'rgba(34,197,94,0.4)', boxShadow: 'inset 0 0 10px rgba(34,197,94,0.3)' }} />
            <div style={{ width: '12%', background: 'rgba(234,179,8,0.2)' }} />
            <div style={{ width: '10%', background: 'rgba(234,179,8,0.3)' }} />
            <div style={{ width: '20%', background: 'rgba(239,68,68,0.3)' }} />
          </div>
          {/* Target line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#ffd700', opacity: 0.6, transform: 'translateX(-50%)' }} />
          {/* Needle */}
          <div style={{
            position: 'absolute', left: `${sliderPos}%`, top: 2, bottom: 2, width: 6,
            background: getZoneColor(sliderPos), borderRadius: 3, transform: 'translateX(-50%)',
            boxShadow: `0 0 8px ${getZoneColor(sliderPos)}`, transition: 'background 0.05s',
          }} />
        </div>

        {phase === 'ready' && (
          <div style={{ color: '#aaa', fontFamily: FONT, fontSize: '0.5rem' }}>
            Hold <span style={{ color: '#ffd700' }}>J</span> to start — release on the <span style={{ color: '#22c55e' }}>GREEN</span> zone!
          </div>
        )}
        {phase === 'charging' && (
          <div style={{ color: '#ff8c00', fontFamily: FONT, fontSize: '0.5rem', animation: 'timerPulse 0.5s infinite' }}>
            Release <span style={{ color: '#ffd700' }}>J</span> NOW!
          </div>
        )}
        {phase === 'result' && result && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: '1.2rem', color: result.gained >= 3 ? '#22c55e' : result.gained >= 1 ? '#eab308' : '#ef4444', marginBottom: 10, textShadow: '0 0 10px currentColor' }}>
              {result.gained >= 5 ? 'PERFECT!' : result.gained >= 3 ? 'GREAT!' : result.gained >= 1 ? 'OK' : 'MISS!'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: '0.7rem', color: '#ffd700', marginBottom: 20 }}>
              +{result.gained} STRENGTH
            </div>
            <ActionButton onClick={() => onComplete(result.gained)}>CONTINUE</ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SPEED TRAINING — Falling Targets
// ═══════════════════════════════════════════════════════════════════════
function SpeedTraining({ onComplete }) {
  const [targets, setTargets] = useState([]);
  const [playerX, setPlayerX] = useState(50);
  const [score, setScore] = useState(0);
  const [spawned, setSpawned] = useState(0);
  const [done, setDone] = useState(false);
  const keysRef = useRef({});
  const containerRef = useRef(null);
  const scoreRef = useRef(0);
  const spawnedRef = useRef(0);
  const targetIdRef = useRef(0);
  const pxRef = useRef(50);

  useEffect(() => { containerRef.current?.focus(); }, []);
  useEffect(() => { pxRef.current = playerX; }, [playerX]);

  // Movement
  useEffect(() => {
    const id = setInterval(() => {
      const k = keysRef.current;
      if (k['a'] || k['arrowleft']) setPlayerX(prev => { const v = Math.max(5, prev - 2); pxRef.current = v; return v; });
      if (k['d'] || k['arrowright']) setPlayerX(prev => { const v = Math.min(95, prev + 2); pxRef.current = v; return v; });
    }, 30);
    return () => clearInterval(id);
  }, []);

  // Spawn targets
  useEffect(() => {
    if (done) return;
    const spawnInterval = setInterval(() => {
      if (spawnedRef.current >= 10) { clearInterval(spawnInterval); return; }
      const id = ++targetIdRef.current;
      const x = 10 + Math.random() * 80;
      setTargets(prev => [...prev, { id, x, y: -5, active: true }]);
      spawnedRef.current++;
      setSpawned(spawnedRef.current);
    }, 1200);
    return () => clearInterval(spawnInterval);
  }, [done]);

  // Fall targets
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setTargets(prev => {
        const updated = prev.map(t => t.active ? { ...t, y: t.y + 1.2 } : t);
        // Remove targets that hit the ground
        const alive = [];
        for (const t of updated) {
          if (t.y >= 88 && t.active) {
            alive.push({ ...t, active: false }); // missed
          } else {
            alive.push(t);
          }
        }
        return alive;
      });
    }, 50);
    return () => clearInterval(id);
  }, [done]);

  // Check done
  useEffect(() => {
    if (spawned >= 10 && targets.length > 0 && targets.every(t => !t.active)) {
      setTimeout(() => setDone(true), 500);
    }
  }, [spawned, targets]);

  // Punch to hit target
  const handleKey = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;
    if (key === 'j') {
      setTargets(prev => {
        const px = pxRef.current;
        let hit = false;
        const updated = prev.map(t => {
          if (!hit && t.active && Math.abs(t.x - px) < 12 && t.y > 50 && t.y < 92) {
            hit = true;
            scoreRef.current++;
            setScore(scoreRef.current);
            return { ...t, active: false, hit: true };
          }
          return t;
        });
        return updated;
      });
    }
  }, []);

  const handleKeyUp = useCallback((e) => { keysRef.current[e.key.toLowerCase()] = false; }, []);

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKey} onKeyUp={handleKeyUp} style={{
      width: '100%', height: '100%', position: 'relative', outline: 'none',
      backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      {/* HUD */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 100, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.8rem', textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>
          SPEED TRAINING
        </div>
        <div style={{ fontFamily: FONT, color: '#48bb78', fontSize: '0.6rem', marginTop: 4 }}>
          Targets: {score}/10
        </div>
      </div>

      {/* Targets */}
      {targets.map(t => (
        <div key={t.id} style={{
          position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
          transform: 'translate(-50%, -50%)', zIndex: 20, pointerEvents: 'none',
          opacity: t.active ? 1 : t.hit ? 0 : 0.3,
          transition: 'opacity 0.2s',
        }}>
          {/* Spinning bullseye */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: t.active ? 'radial-gradient(circle, #fff 15%, #ef4444 30%, #fff 45%, #ef4444 60%, #fff 75%, #ef4444 90%)' : '#555',
            border: '2px solid #c00', boxShadow: t.active ? '0 0 12px rgba(239,68,68,0.5)' : 'none',
            animation: t.active ? 'targetSpin 0.6s linear infinite' : 'none',
          }} />
          {t.hit && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', color: '#22c55e', fontFamily: FONT, fontSize: '0.5rem', animation: 'actionFloat 0.5s ease-out forwards' }}>+1</span>}
        </div>
      ))}

      {/* Player position indicator */}
      <div style={{
        position: 'absolute', left: `${playerX}%`, bottom: '15%',
        transform: 'translateX(-50%)', zIndex: 30, textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem' }}>🥊</div>
        <div style={{ width: 30, height: 4, background: '#ffd700', borderRadius: 2, margin: '0 auto', opacity: 0.5 }} />
      </div>

      {/* Ground line */}
      <div style={{ position: 'absolute', bottom: '12%', left: 0, right: 0, height: 2, background: 'rgba(255,215,0,0.2)', zIndex: 10 }} />

      {done && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: '1.2rem', color: score >= 8 ? '#22c55e' : score >= 5 ? '#eab308' : '#ef4444', marginBottom: 10, textShadow: '0 0 10px currentColor' }}>
              {score >= 8 ? 'LIGHTNING FAST!' : score >= 5 ? 'NICE REFLEXES!' : 'KEEP PRACTICING!'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: '0.7rem', color: '#ffd700', marginBottom: 20 }}>+{score} SPEED</div>
            <ActionButton onClick={() => onComplete(score)}>CONTINUE</ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH TRAINING — Dodge Drill
// ═══════════════════════════════════════════════════════════════════════
function HealthTraining({ onComplete }) {
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('wait'); // wait, incoming, result, done
  const [lastResult, setLastResult] = useState(null);
  const [playerState, setPlayerState] = useState('idle'); // idle, blocking, dodging, hit
  const [opX, setOpX] = useState(70);
  const containerRef = useRef(null);
  const phaseRef = useRef(phase);
  const playerStateRef = useRef('idle');
  const scoreRef = useRef(0);
  const attemptRef = useRef(0);
  const jabWindowRef = useRef(false);

  useEffect(() => { containerRef.current?.focus(); }, [phase]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { playerStateRef.current = playerState; }, [playerState]);

  // Start next jab sequence
  useEffect(() => {
    if (phase !== 'wait' || attempt >= 10) return;
    const delay = 1000 + Math.random() * 1000;

    // Opponent walks in
    const walkTimer = setTimeout(() => {
      setOpX(45);
      setPhase('incoming');
    }, delay);

    return () => clearTimeout(walkTimer);
  }, [phase, attempt]);

  // Jab timing window
  useEffect(() => {
    if (phase !== 'incoming') return;

    const jabTimer = setTimeout(() => {
      jabWindowRef.current = true;

      // Check if player is blocking or dodging
      const checkTimer = setTimeout(() => {
        jabWindowRef.current = false;
        const state = playerStateRef.current;
        const didDefend = state === 'blocking' || state === 'dodging';

        if (didDefend) {
          scoreRef.current++;
          setScore(scoreRef.current);
          setLastResult('DEFENDED!');
        } else {
          setPlayerState('hit');
          setLastResult('HIT!');
          setTimeout(() => setPlayerState('idle'), 400);
        }

        attemptRef.current++;
        setAttempt(attemptRef.current);

        // Opponent backs away
        setOpX(70);

        if (attemptRef.current >= 10) {
          setPhase('done');
        } else {
          setPhase('result');
          setTimeout(() => setPhase('wait'), 1200);
        }
      }, 500); // 500ms window to block/dodge

      return () => clearTimeout(checkTimer);
    }, 600); // 600ms approach time

    return () => clearTimeout(jabTimer);
  }, [phase]);

  const handleKey = useCallback((e) => {
    const key = e.key.toLowerCase();
    if (key === 'shift') setPlayerState('blocking');
    if (key === ' ') { e.preventDefault(); setPlayerState('dodging'); setTimeout(() => setPlayerState(prev => prev === 'dodging' ? 'idle' : prev), 400); }
  }, []);

  const handleKeyUp = useCallback((e) => {
    if (e.key.toLowerCase() === 'shift') setPlayerState(prev => prev === 'blocking' ? 'idle' : prev);
  }, []);

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKey} onKeyUp={handleKeyUp} style={{
      width: '100%', height: '100%', position: 'relative', outline: 'none',
      backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      {/* HUD */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 100, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.8rem', textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>
          HEALTH TRAINING
        </div>
        <div style={{ fontFamily: FONT, color: '#48bb78', fontSize: '0.55rem', marginTop: 4 }}>
          Defended: {score}/10 — Attempt {Math.min(attempt + 1, 10)}/10
        </div>
        <div style={{ fontFamily: FONT, color: '#888', fontSize: '0.4rem', marginTop: 4 }}>
          SHIFT = Block | SPACE = Dodge | No moving!
        </div>
      </div>

      {/* Player (left side, fixed position) */}
      <div style={{
        position: 'absolute', left: '25%', bottom: '15%', transform: 'translateX(-50%)',
        fontSize: '3rem', zIndex: 20,
        filter: playerState === 'hit' ? 'brightness(2) saturate(0)' : playerState === 'blocking' ? 'brightness(0.7)' : playerState === 'dodging' ? 'hue-rotate(180deg)' : 'none',
        animation: playerState === 'dodging' ? 'gkoDodgeTilt 400ms ease-in-out' : 'none',
        transformOrigin: 'bottom center',
        transform: playerState === 'blocking' ? 'translateX(-50%) scaleY(0.9)' : 'translateX(-50%)',
      }}>🧍</div>

      {/* Opponent */}
      <div style={{
        position: 'absolute', left: `${opX}%`, bottom: '15%', transform: 'translateX(-50%) scaleX(-1)',
        fontSize: '3rem', zIndex: 20, transition: 'left 0.4s ease',
      }}>🥊</div>

      {/* Incoming warning */}
      {phase === 'incoming' && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, fontFamily: FONT, fontSize: '0.7rem', color: '#ff4444', textShadow: '0 0 10px rgba(255,0,0,0.5)', animation: 'timerPulse 0.3s infinite' }}>
          ⚠️ INCOMING!
        </div>
      )}

      {/* Last result */}
      {lastResult && phase === 'result' && (
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, fontFamily: FONT, fontSize: '0.8rem', color: lastResult === 'DEFENDED!' ? '#22c55e' : '#ef4444', textShadow: '0 0 10px currentColor', animation: 'actionFloat 1s ease-out forwards' }}>
          {lastResult}
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: '1.2rem', color: score >= 8 ? '#22c55e' : score >= 5 ? '#eab308' : '#ef4444', marginBottom: 10, textShadow: '0 0 10px currentColor' }}>
              {score >= 8 ? 'IRON CHIN!' : score >= 5 ? 'TOUGH GUY!' : 'GLASS JAW!'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: '0.7rem', color: '#ffd700', marginBottom: 20 }}>+{score} HEALTH</div>
            <ActionButton onClick={() => onComplete(score)}>CONTINUE</ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN CAMPAIGN HUB
// ═══════════════════════════════════════════════════════════════════════
export default function GKOCampaign() {
  const [screen, setScreen] = useState('lobby'); // lobby, training_pick, strength, speed, health, fight, postfight
  const [stats, setStats] = useState({ strength: 10, speed: 10, health: 10 });
  const [opponentIdx, setOpponentIdx] = useState(0);
  const [record, setRecord] = useState({ wins: 0, losses: 0 });
  const [lastFightResult, setLastFightResult] = useState(null);
  const [trainedThisRound, setTrainedThisRound] = useState(false);

  const currentOpponent = OPPONENTS[opponentIdx] || OPPONENTS[OPPONENTS.length - 1];
  const campaignComplete = opponentIdx >= OPPONENTS.length;

  const handleTrainingComplete = (type, gained) => {
    setStats(prev => ({ ...prev, [type]: Math.min(100, prev[type] + gained) }));
    setTrainedThisRound(true);
    setScreen('lobby');
  };

  const handleFightEnd = (result) => {
    // result: 'win' or 'lose'
    if (result === 'win') {
      setRecord(prev => ({ ...prev, wins: prev.wins + 1 }));
      setOpponentIdx(prev => prev + 1);
    } else {
      setRecord(prev => ({ ...prev, losses: prev.losses + 1 }));
    }
    setLastFightResult(result);
    setTrainedThisRound(false);
    setScreen('postfight');
  };

  // ── Inject styles ──
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @keyframes actionFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-50px) scale(0.7); opacity: 0; } }
      @keyframes timerPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @keyframes targetSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes gkoDodgeTilt {
        0% { transform: translateX(-50%) rotate(0deg); }
        30% { transform: translateX(-50%) rotate(-12deg) translateX(10px); }
        70% { transform: translateX(-50%) rotate(-12deg) translateX(10px); }
        100% { transform: translateX(-50%) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── LOBBY ──
  if (screen === 'lobby') {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.35)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.05) 0%, transparent 60%)' }} />

        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <h1 style={{ fontFamily: FONT, color: '#ffd700', fontSize: '1.4rem', textShadow: '0 0 20px rgba(255,215,0,0.4), 3px 3px 0 #000', letterSpacing: 4 }}>
            G.K.O. BOXING
          </h1>

          {/* Stats + Opponent panels */}
          <div style={{ display: 'flex', gap: 24, maxWidth: 700, width: '90%' }}>
            {/* Player stats */}
            <div style={{ flex: 1, background: panelBg, border: goldBorder, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.55rem', marginBottom: 12 }}>RAZE — FIGHTER STATS</div>
              <StatBar label="STRENGTH" value={stats.strength} max={100} color="#ef4444" />
              <StatBar label="SPEED" value={stats.speed} max={100} color="#3b82f6" />
              <StatBar label="HEALTH" value={stats.health} max={100} color="#22c55e" />
              <div style={{ marginTop: 12, fontFamily: FONT, fontSize: '0.4rem', color: '#888' }}>
                Record: <span style={{ color: '#22c55e' }}>{record.wins}W</span> / <span style={{ color: '#ef4444' }}>{record.losses}L</span>
              </div>
            </div>

            {/* Next opponent */}
            <div style={{ flex: 1, background: panelBg, border: goldBorder, borderRadius: 12, padding: 20 }}>
              {campaignComplete ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.7rem', marginBottom: 10 }}>🏆 CHAMPION 🏆</div>
                  <div style={{ fontFamily: FONT, color: '#aaa', fontSize: '0.45rem' }}>You conquered the underground!</div>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: FONT, color: '#888', fontSize: '0.45rem', marginBottom: 8 }}>NEXT OPPONENT</div>
                  <div style={{ fontFamily: FONT, color: currentOpponent.color, fontSize: '0.8rem', marginBottom: 6, textShadow: `0 0 8px ${currentOpponent.color}40` }}>
                    {currentOpponent.name}
                  </div>
                  <div style={{ fontFamily: FONT, color: '#aaa', fontSize: '0.38rem', lineHeight: 1.8, marginBottom: 12 }}>
                    {currentOpponent.desc}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: '0.35rem', color: '#666' }}>
                    Difficulty: {'🔴'.repeat(Math.ceil(currentOpponent.difficulty * 3))}{'⚫'.repeat(5 - Math.ceil(currentOpponent.difficulty * 3))}
                  </div>
                  {/* Ladder progress */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                    {OPPONENTS.map((op, i) => (
                      <div key={i} style={{
                        flex: 1, height: 6, borderRadius: 3,
                        background: i < opponentIdx ? '#22c55e' : i === opponentIdx ? op.color : '#333',
                        opacity: i <= opponentIdx ? 1 : 0.4,
                      }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 16 }}>
            {!campaignComplete && (
              <>
                <ActionButton onClick={() => setScreen('training_pick')} color="#3b82f6" disabled={trainedThisRound}>
                  {trainedThisRound ? 'TRAINED ✓' : '🏋️ TRAINING'}
                </ActionButton>
                <ActionButton onClick={() => setScreen('fight')} color="#ef4444">
                  🥊 FIGHT {currentOpponent.name}
                </ActionButton>
              </>
            )}
            {campaignComplete && (
              <ActionButton onClick={() => { setOpponentIdx(0); setRecord({ wins: 0, losses: 0 }); setStats({ strength: 10, speed: 10, health: 10 }); setTrainedThisRound(false); }}>
                NEW CAREER
              </ActionButton>
            )}
          </div>

          <a href="/" style={{ fontFamily: FONT, fontSize: '0.4rem', color: '#666', textDecoration: 'none', padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 4, border: '1px solid #333' }}>← BACK</a>
        </div>
      </div>
    );
  }

  // ── TRAINING PICK ──
  if (screen === 'training_pick') {
    const options = [
      { key: 'strength', label: 'STRENGTH', desc: 'Punch the bag! Time your release.', icon: '💪', color: '#ef4444', stat: stats.strength },
      { key: 'speed', label: 'SPEED', desc: 'Smash falling targets before they land.', icon: '⚡', color: '#3b82f6', stat: stats.speed },
      { key: 'health', label: 'HEALTH', desc: 'Dodge & block incoming jabs.', icon: '❤️', color: '#22c55e', stat: stats.health },
    ];
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARENA_BG_DAY})`, backgroundSize: 'cover', filter: 'brightness(0.3)' }} />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <h2 style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.9rem', textShadow: '0 0 10px rgba(255,215,0,0.4)' }}>CHOOSE TRAINING</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            {options.map(opt => (
              <div key={opt.key} onClick={() => setScreen(opt.key)} style={{
                background: panelBg, border: `1px solid ${opt.color}44`, borderRadius: 12,
                padding: 20, width: 160, cursor: 'pointer', textAlign: 'center',
                transition: 'border-color 0.2s, transform 0.1s',
              }} onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.transform = 'scale(1.05)'; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = `${opt.color}44`; e.currentTarget.style.transform = 'scale(1)'; }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{opt.icon}</div>
                <div style={{ fontFamily: FONT, color: opt.color, fontSize: '0.55rem', marginBottom: 6 }}>{opt.label}</div>
                <div style={{ fontFamily: FONT, color: '#888', fontSize: '0.35rem', lineHeight: 1.6, marginBottom: 8 }}>{opt.desc}</div>
                <div style={{ fontFamily: FONT, color: '#666', fontSize: '0.35rem' }}>Current: {opt.stat}</div>
              </div>
            ))}
          </div>
          <ActionButton onClick={() => setScreen('lobby')} color="#666">← BACK</ActionButton>
        </div>
      </div>
    );
  }

  // ── TRAINING MINIGAMES ──
  if (screen === 'strength') return <StrengthTraining onComplete={(g) => handleTrainingComplete('strength', g)} />;
  if (screen === 'speed') return <SpeedTraining onComplete={(g) => handleTrainingComplete('speed', g)} />;
  if (screen === 'health') return <HealthTraining onComplete={(g) => handleTrainingComplete('health', g)} />;

  // ── FIGHT ──
  if (screen === 'fight') {
    return <GKOBoxing
      playerStats={stats}
      opponentConfig={currentOpponent}
      onFightEnd={handleFightEnd}
    />;
  }

  // ── POST-FIGHT ──
  if (screen === 'postfight') {
    const won = lastFightResult === 'win';
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', filter: 'brightness(0.3)' }} />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: FONT, fontSize: '2rem', color: won ? '#22c55e' : '#ef4444', textShadow: `0 0 20px ${won ? '#22c55e' : '#ef4444'}66`, letterSpacing: 4 }}>
            {won ? 'VICTORY!' : 'DEFEAT'}
          </div>
          <div style={{ fontFamily: FONT, fontSize: '0.5rem', color: '#aaa' }}>
            {won ? `You defeated ${OPPONENTS[opponentIdx - 1]?.name || 'the opponent'}!` : `${currentOpponent.name} got the better of you.`}
          </div>
          {won && opponentIdx < OPPONENTS.length && (
            <div style={{ fontFamily: FONT, fontSize: '0.45rem', color: '#ffd700', background: 'rgba(255,215,0,0.1)', padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.2)' }}>
              Next: {OPPONENTS[opponentIdx].name}
            </div>
          )}
          <ActionButton onClick={() => setScreen('lobby')}>CONTINUE</ActionButton>
        </div>
      </div>
    );
  }

  return null;
}
