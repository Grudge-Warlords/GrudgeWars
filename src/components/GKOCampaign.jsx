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
// STRENGTH TRAINING — 3-Hit Sandbag Punch Slider
// ═══════════════════════════════════════════════════════════════════════
function StrengthTraining({ onComplete }) {
  const MAX_HITS = 3;
  const [hitNum, setHitNum] = useState(0); // 0, 1, 2
  const [phase, setPhase] = useState('ready'); // ready, charging, hitResult, done
  const [sliderPos, setSliderPos] = useState(0);
  const [hitResults, setHitResults] = useState([]); // [{gained, label}]
  const [sliderSpeed, setSliderSpeed] = useState(2.5);
  const intervalRef = useRef(null);
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => { containerRef.current?.focus(); }, [phase]);

  // Slider speeds up each hit
  useEffect(() => {
    if (phase !== 'charging') { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    const speed = 2.5 + hitNum * 0.8; // gets faster each hit
    posRef.current = 0;
    dirRef.current = 1;
    intervalRef.current = setInterval(() => {
      posRef.current += dirRef.current * speed;
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
      setSliderPos(posRef.current);
    }, 20);
    return () => clearInterval(intervalRef.current);
  }, [phase, hitNum]);

  const scoreHit = (pos) => {
    if (pos >= 42 && pos <= 58) return { gained: 2, label: 'PERFECT!' };
    if (pos >= 30 && pos <= 70) return { gained: 1, label: 'GREAT!' };
    if (pos >= 20 && pos <= 80) return { gained: 1, label: 'OK' };
    return { gained: 0, label: 'MISS!' };
  };

  const handleKey = useCallback((e) => {
    if (e.key.toLowerCase() !== 'j') return;
    if (phase === 'ready') { setPhase('charging'); return; }
    if (phase === 'charging') {
      clearInterval(intervalRef.current);
      const result = scoreHit(posRef.current);
      setHitResults(prev => [...prev, result]);
      if (hitNum + 1 >= MAX_HITS) {
        setPhase('done');
      } else {
        setPhase('hitResult');
        // Auto-advance to next hit after brief pause
        setTimeout(() => {
          setHitNum(prev => prev + 1);
          setPhase('charging');
        }, 800);
      }
    }
  }, [phase, hitNum]);

  const getZoneColor = (pos) => {
    if (pos >= 42 && pos <= 58) return '#22c55e';
    if (pos >= 30 && pos <= 70) return '#eab308';
    return '#ef4444';
  };

  const totalGained = hitResults.reduce((s, r) => s + r.gained, 0);
  const lastHit = hitResults[hitResults.length - 1];

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKey} style={{
      width: '100%', height: '100%', position: 'relative', outline: 'none',
      backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 500, width: '90%' }}>
        <h2 style={{ fontFamily: FONT, color: '#ffd700', fontSize: '1rem', marginBottom: 8, textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
          STRENGTH TRAINING
        </h2>

        {/* Hit counter */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          {[...Array(MAX_HITS)].map((_, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < hitResults.length ? (hitResults[i].gained >= 3 ? '#22c55e' : hitResults[i].gained >= 1 ? '#eab308' : '#ef4444') : i === hitNum && phase !== 'done' ? 'rgba(255,215,0,0.3)' : '#222',
              border: i === hitNum && phase !== 'done' ? '2px solid #ffd700' : '1px solid #444',
              fontFamily: FONT, fontSize: '0.4rem', color: '#fff',
            }}>{i < hitResults.length ? `+${hitResults[i].gained}` : i + 1}</div>
          ))}
        </div>

        {/* Punching bag */}
        <div style={{ fontSize: '4rem', marginBottom: 16, transition: 'transform 0.1s', transform: lastHit && phase === 'hitResult' ? 'translateX(20px) rotate(10deg)' : 'none' }}>🥊</div>

        {/* Slider */}
        <div style={{ position: 'relative', width: '100%', height: 40, background: '#1a1a2e', border: '2px solid #444', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ width: '20%', background: 'rgba(239,68,68,0.3)' }} />
            <div style={{ width: '10%', background: 'rgba(234,179,8,0.3)' }} />
            <div style={{ width: '12%', background: 'rgba(234,179,8,0.2)' }} />
            <div style={{ width: '16%', background: 'rgba(34,197,94,0.4)', boxShadow: 'inset 0 0 10px rgba(34,197,94,0.3)' }} />
            <div style={{ width: '12%', background: 'rgba(234,179,8,0.2)' }} />
            <div style={{ width: '10%', background: 'rgba(234,179,8,0.3)' }} />
            <div style={{ width: '20%', background: 'rgba(239,68,68,0.3)' }} />
          </div>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#ffd700', opacity: 0.6, transform: 'translateX(-50%)' }} />
          <div style={{
            position: 'absolute', left: `${sliderPos}%`, top: 2, bottom: 2, width: 6,
            background: getZoneColor(sliderPos), borderRadius: 3, transform: 'translateX(-50%)',
            boxShadow: `0 0 8px ${getZoneColor(sliderPos)}`, transition: 'background 0.05s',
          }} />
        </div>

        {/* Last hit flash */}
        {phase === 'hitResult' && lastHit && (
          <div style={{ fontFamily: FONT, fontSize: '0.8rem', color: lastHit.gained >= 3 ? '#22c55e' : lastHit.gained >= 1 ? '#eab308' : '#ef4444', textShadow: '0 0 10px currentColor', animation: 'actionFloat 0.8s ease-out forwards' }}>
            {lastHit.label} +{lastHit.gained}
          </div>
        )}

        {phase === 'ready' && (
          <div style={{ color: '#aaa', fontFamily: FONT, fontSize: '0.5rem' }}>
            Press <span style={{ color: '#ffd700' }}>J</span> to start — 3 punches! Hit the <span style={{ color: '#22c55e' }}>GREEN</span> zone!
          </div>
        )}
        {phase === 'charging' && (
          <div style={{ color: '#ff8c00', fontFamily: FONT, fontSize: '0.5rem', animation: 'timerPulse 0.5s infinite' }}>
            HIT {hitNum + 1}/{MAX_HITS} — Press <span style={{ color: '#ffd700' }}>J</span>!
          </div>
        )}
        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: '1rem', color: totalGained >= 5 ? '#22c55e' : totalGained >= 3 ? '#eab308' : '#ef4444', marginBottom: 8, textShadow: '0 0 10px currentColor' }}>
              {totalGained >= 5 ? 'DEVASTATING!' : totalGained >= 3 ? 'POWERFUL!' : totalGained >= 1 ? 'DECENT' : 'WEAK...'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: '0.7rem', color: '#ffd700', marginBottom: 16 }}>
              TOTAL: +{totalGained} STRENGTH
            </div>
            <ActionButton onClick={() => onComplete(totalGained)}>CONTINUE</ActionButton>
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
            {(() => { const gained = Math.ceil(score / 2); return (<>
            <div style={{ fontFamily: FONT, fontSize: '1.2rem', color: gained >= 4 ? '#22c55e' : gained >= 2 ? '#eab308' : '#ef4444', marginBottom: 10, textShadow: '0 0 10px currentColor' }}>
              {gained >= 4 ? 'LIGHTNING FAST!' : gained >= 2 ? 'NICE REFLEXES!' : 'KEEP PRACTICING!'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: '0.6rem', color: '#aaa', marginBottom: 4 }}>{score}/10 targets hit</div>
            <div style={{ fontFamily: FONT, fontSize: '0.7rem', color: '#ffd700', marginBottom: 20 }}>+{gained} SPEED</div>
            <ActionButton onClick={() => onComplete(gained)}>CONTINUE</ActionButton>
            </>); })()}
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
            {(() => { const gained = Math.ceil(score / 2); return (<>
            <div style={{ fontFamily: FONT, fontSize: '1.2rem', color: gained >= 4 ? '#22c55e' : gained >= 2 ? '#eab308' : '#ef4444', marginBottom: 10, textShadow: '0 0 10px currentColor' }}>
              {gained >= 4 ? 'IRON CHIN!' : gained >= 2 ? 'TOUGH GUY!' : 'GLASS JAW!'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: '0.6rem', color: '#aaa', marginBottom: 4 }}>{score}/10 defended</div>
            <div style={{ fontFamily: FONT, fontSize: '0.7rem', color: '#ffd700', marginBottom: 20 }}>+{gained} HEALTH</div>
            <ActionButton onClick={() => onComplete(gained)}>CONTINUE</ActionButton>
            </>); })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PVE ROSTER — 8 fighters with records, stats, AI sim
// ═══════════════════════════════════════════════════════════════════════
// Each fighter gets a unique CSS filter to recolor the same base sprite
const INITIAL_ROSTER = [
  { id: 'raze',    name: 'RAZE',    color: '#3b82f6', filter: 'none',                                         difficulty: 1.0,  isPlayer: true,  wins: 0, losses: 0, stats: { strength: 10, speed: 10, health: 10 } },
  { id: 'iron',    name: 'IRON MAX', color: '#ef4444', filter: 'hue-rotate(-30deg) saturate(1.6) brightness(1.1)', difficulty: 1.3,  isPlayer: false, wins: 2, losses: 0, stats: { strength: 18, speed: 12, health: 16 } },
  { id: 'vex',     name: 'VEX',     color: '#a855f7', filter: 'hue-rotate(240deg) saturate(1.4) brightness(1.05)',difficulty: 1.2,  isPlayer: false, wins: 2, losses: 0, stats: { strength: 14, speed: 16, health: 14 } },
  { id: 'brick',   name: 'BRICK',   color: '#f97316', filter: 'hue-rotate(30deg) saturate(1.8) brightness(0.95)', difficulty: 0.9,  isPlayer: false, wins: 1, losses: 1, stats: { strength: 16, speed: 10, health: 14 } },
  { id: 'phantom', name: 'PHANTOM', color: '#22d3ee', filter: 'hue-rotate(160deg) saturate(1.3) brightness(1.2)', difficulty: 1.0,  isPlayer: false, wins: 1, losses: 1, stats: { strength: 12, speed: 18, health: 10 } },
  { id: 'skull',   name: 'SKULL',   color: '#6b7280', filter: 'saturate(0.3) brightness(0.8) contrast(1.3)',     difficulty: 0.85, isPlayer: false, wins: 1, losses: 1, stats: { strength: 14, speed: 12, health: 14 } },
  { id: 'blaze',   name: 'BLAZE',   color: '#f59e0b', filter: 'hue-rotate(60deg) saturate(2.0) brightness(1.15)', difficulty: 0.8,  isPlayer: false, wins: 1, losses: 1, stats: { strength: 12, speed: 14, health: 12 } },
  { id: 'rookie',  name: 'ROOKIE',  color: '#48bb78', filter: 'hue-rotate(100deg) saturate(1.2) brightness(1.1)', difficulty: 0.6,  isPlayer: false, wins: 1, losses: 1, stats: { strength: 10, speed: 10, health: 10 } },
];

function sortStandings(roster) {
  return [...roster].sort((a, b) => {
    const aPct = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const bPct = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (bPct !== aPct) return bPct - aPct;
    return a.losses - b.losses;
  });
}

// Sim a fight between two AI fighters. Higher stats + difficulty = higher win chance.
function simAIFight(a, b) {
  const aPower = (a.stats.strength + a.stats.speed + a.stats.health) * a.difficulty + Math.random() * 20;
  const bPower = (b.stats.strength + b.stats.speed + b.stats.health) * b.difficulty + Math.random() * 20;
  return aPower >= bPower ? a.id : b.id;
}

// Give AI fighters small random stat gains between rounds (much less than player)
function aiTrainStats(stats) {
  const pick = ['strength', 'speed', 'health'][Math.floor(Math.random() * 3)];
  return { ...stats, [pick]: Math.min(100, stats[pick] + Math.floor(Math.random() * 2) + 1) };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN CAMPAIGN HUB
// ═══════════════════════════════════════════════════════════════════════
export default function GKOCampaign() {
  const [screen, setScreen] = useState('lobby');
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [lastFightResult, setLastFightResult] = useState(null);
  const [lastSimResults, setLastSimResults] = useState([]);
  const [trainedThisRound, setTrainedThisRound] = useState(false);
  const [showSimResults, setShowSimResults] = useState(false);

  const player = roster.find(f => f.isPlayer);
  const standings = sortStandings(roster);
  const playerRank = standings.findIndex(f => f.isPlayer) + 1;
  const isChampion = playerRank === 1 && player.wins >= 3;

  // Matchmaking: player fights the person directly above them in standings (or anyone below if #1)
  const getNextOpponent = () => {
    if (playerRank <= 1) return standings.find(f => !f.isPlayer); // fight #2
    return standings[playerRank - 2]; // fight the person above
  };

  const handleTrainingComplete = (type, gained) => {
    setRoster(prev => prev.map(f => f.isPlayer ? { ...f, stats: { ...f.stats, [type]: Math.min(100, f.stats[type] + gained) } } : f));
    setTrainedThisRound(true);
    setScreen('lobby');
  };

  const simOtherFights = () => {
    // Pair up non-player fighters for 1-2 simulated bouts
    const aiRoster = roster.filter(f => !f.isPlayer);
    const results = [];
    const shuffled = [...aiRoster].sort(() => Math.random() - 0.5);
    const pairCount = Math.min(2, Math.floor(shuffled.length / 2));
    for (let i = 0; i < pairCount; i++) {
      const a = shuffled[i * 2];
      const b = shuffled[i * 2 + 1];
      if (!a || !b) break;
      const winnerId = simAIFight(a, b);
      results.push({ a: a.id, b: b.id, winner: winnerId });
    }
    return results;
  };

  const applySimResults = (simResults) => {
    setRoster(prev => {
      let updated = [...prev];
      for (const r of simResults) {
        updated = updated.map(f => {
          if (f.id === r.winner) return { ...f, wins: f.wins + 1 };
          if (f.id === r.a || f.id === r.b) return { ...f, losses: f.losses + 1 };
          return f;
        });
      }
      // AI training: small gains
      updated = updated.map(f => f.isPlayer ? f : { ...f, stats: aiTrainStats(f.stats) });
      return updated;
    });
  };

  const handleFightEnd = (result) => {
    const opId = selectedOpponent?.id;
    setRoster(prev => prev.map(f => {
      if (f.isPlayer) return { ...f, wins: f.wins + (result === 'win' ? 1 : 0), losses: f.losses + (result === 'lose' ? 1 : 0) };
      if (f.id === opId) return { ...f, wins: f.wins + (result === 'lose' ? 1 : 0), losses: f.losses + (result === 'win' ? 1 : 0) };
      return f;
    }));
    // Sim other fights while player was fighting
    const simResults = simOtherFights();
    applySimResults(simResults);
    setLastSimResults(simResults);
    setLastFightResult(result);
    setTrainedThisRound(false);
    setScreen('postfight');
  };

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
    const nextOp = getNextOpponent();
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.35)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.05) 0%, transparent 60%)' }} />

        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', overflow: 'auto' }}>
          <h1 style={{ fontFamily: FONT, color: '#ffd700', fontSize: '1.2rem', textShadow: '0 0 20px rgba(255,215,0,0.4), 3px 3px 0 #000', letterSpacing: 4, marginBottom: 10 }}>
            G.K.O. BOXING — PVE
          </h1>
          {isChampion && <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.6rem', marginBottom: 8, textShadow: '0 0 12px rgba(255,215,0,0.6)' }}>🏆 UNDERGROUND CHAMPION 🏆</div>}

          <div style={{ display: 'flex', gap: 16, maxWidth: 900, width: '95%', flex: 1, minHeight: 0 }}>
            {/* Left: Player stats */}
            <div style={{ width: 220, background: panelBg, border: goldBorder, borderRadius: 12, padding: 16, flexShrink: 0 }}>
              <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.5rem', marginBottom: 10 }}>RAZE — #{playerRank}</div>
              <StatBar label="STRENGTH" value={player.stats.strength} max={100} color="#ef4444" />
              <StatBar label="SPEED" value={player.stats.speed} max={100} color="#3b82f6" />
              <StatBar label="HEALTH" value={player.stats.health} max={100} color="#22c55e" />
              <div style={{ marginTop: 10, fontFamily: FONT, fontSize: '0.4rem', color: '#888' }}>
                Record: <span style={{ color: '#22c55e' }}>{player.wins}W</span> / <span style={{ color: '#ef4444' }}>{player.losses}L</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: FONT, fontSize: '0.35rem', color: '#666' }}>
                STR: +{Math.max(0, Math.round((player.stats.strength - 10) * 2))}% dmg<br/>
                SPD: -{Math.max(0, Math.round((player.stats.speed - 10) * 0.5))}% cooldown<br/>
                HP: +{Math.max(0, (player.stats.health - 10) * 2)} max hp
              </div>
            </div>

            {/* Center: Standings */}
            <div style={{ flex: 1, background: panelBg, border: goldBorder, borderRadius: 12, padding: 16, overflow: 'auto' }}>
              <div style={{ fontFamily: FONT, color: '#ffd700', fontSize: '0.5rem', marginBottom: 10 }}>STANDINGS</div>
              {standings.map((f, i) => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  background: f.isPlayer ? 'rgba(59,130,246,0.15)' : (i === 0 ? 'rgba(255,215,0,0.08)' : 'transparent'),
                  border: f.isPlayer ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  borderRadius: 6, marginBottom: 3,
                }}>
                  <span style={{ fontFamily: FONT, fontSize: '0.5rem', color: i === 0 ? '#ffd700' : '#888', width: 20, textAlign: 'center' }}>
                    {i === 0 ? '👑' : `#${i + 1}`}
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: '0.45rem', color: f.color, flex: 1, fontWeight: f.isPlayer ? 900 : 400 }}>
                    {f.name} {f.isPlayer ? '(YOU)' : ''}
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: '0.4rem', color: '#22c55e' }}>{f.wins}W</span>
                  <span style={{ fontFamily: FONT, fontSize: '0.35rem', color: '#666' }}>-</span>
                  <span style={{ fontFamily: FONT, fontSize: '0.4rem', color: '#ef4444' }}>{f.losses}L</span>
                  <div style={{ display: 'flex', gap: 2, marginLeft: 6 }}>
                    <div style={{ width: 16, height: 4, borderRadius: 2, background: '#ef4444', opacity: 0.5 }}><div style={{ height: '100%', width: `${(f.stats.strength / 100) * 100}%`, background: '#ef4444', borderRadius: 2 }} /></div>
                    <div style={{ width: 16, height: 4, borderRadius: 2, background: '#3b82f6', opacity: 0.5 }}><div style={{ height: '100%', width: `${(f.stats.speed / 100) * 100}%`, background: '#3b82f6', borderRadius: 2 }} /></div>
                    <div style={{ width: 16, height: 4, borderRadius: 2, background: '#22c55e', opacity: 0.5 }}><div style={{ height: '100%', width: `${(f.stats.health / 100) * 100}%`, background: '#22c55e', borderRadius: 2 }} /></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Next fight */}
            <div style={{ width: 220, background: panelBg, border: goldBorder, borderRadius: 12, padding: 16, flexShrink: 0 }}>
              {isChampion ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: FONT, fontSize: '0.5rem', color: '#ffd700', marginBottom: 8 }}>CHAMPION</div>
                  <div style={{ fontFamily: FONT, fontSize: '0.35rem', color: '#aaa', lineHeight: 1.8 }}>You hold the belt. Defend it or start a new career.</div>
                  <div style={{ marginTop: 16 }}>
                    <ActionButton onClick={() => { setRoster(INITIAL_ROSTER); setTrainedThisRound(false); setLastSimResults([]); }} color="#666">NEW CAREER</ActionButton>
                  </div>
                </div>
              ) : nextOp ? (
                <>
                  <div style={{ fontFamily: FONT, color: '#888', fontSize: '0.4rem', marginBottom: 6 }}>NEXT FIGHT</div>
                  <div style={{ fontFamily: FONT, color: nextOp.color, fontSize: '0.6rem', marginBottom: 4 }}>{nextOp.name}</div>
                  <div style={{ fontFamily: FONT, color: '#888', fontSize: '0.35rem', marginBottom: 4 }}>#{standings.findIndex(f => f.id === nextOp.id) + 1} in standings</div>
                  <div style={{ fontFamily: FONT, color: '#666', fontSize: '0.35rem', marginBottom: 8 }}>
                    {nextOp.wins}W - {nextOp.losses}L
                  </div>
                  <StatBar label="STR" value={nextOp.stats.strength} max={100} color="#ef4444" />
                  <StatBar label="SPD" value={nextOp.stats.speed} max={100} color="#3b82f6" />
                  <StatBar label="HP" value={nextOp.stats.health} max={100} color="#22c55e" />
                </>
              ) : null}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {!isChampion && (
              <>
                <ActionButton onClick={() => setScreen('training_pick')} color="#3b82f6" disabled={trainedThisRound}>
                  {trainedThisRound ? 'TRAINED ✓' : '🏋️ TRAINING'}
                </ActionButton>
                <ActionButton onClick={() => { setSelectedOpponent(getNextOpponent()); setScreen('fight'); }} color="#ef4444" disabled={!getNextOpponent()}>
                  🥊 FIGHT
                </ActionButton>
              </>
            )}
          </div>
          <a href="/" style={{ fontFamily: FONT, fontSize: '0.4rem', color: '#666', textDecoration: 'none', padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 4, border: '1px solid #333', marginTop: 8 }}>← BACK</a>
        </div>
      </div>
    );
  }

  // ── TRAINING PICK ──
  if (screen === 'training_pick') {
    const options = [
      { key: 'strength', label: 'STRENGTH', desc: 'Punch the bag! Time your release.', icon: '💪', color: '#ef4444', stat: player.stats.strength },
      { key: 'speed', label: 'SPEED', desc: 'Smash falling targets before they land.', icon: '⚡', color: '#3b82f6', stat: player.stats.speed },
      { key: 'health', label: 'HEALTH', desc: 'Dodge & block incoming jabs.', icon: '❤️', color: '#22c55e', stat: player.stats.health },
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
  if (screen === 'fight' && selectedOpponent) {
    return <GKOBoxing
      playerStats={player.stats}
      opponentConfig={selectedOpponent}
      onFightEnd={handleFightEnd}
    />;
  }

  // ── POST-FIGHT ──
  if (screen === 'postfight') {
    const won = lastFightResult === 'win';
    const newStandings = sortStandings(roster);
    const newRank = newStandings.findIndex(f => f.isPlayer) + 1;
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', filter: 'brightness(0.3)' }} />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontFamily: FONT, fontSize: '1.8rem', color: won ? '#22c55e' : '#ef4444', textShadow: `0 0 20px ${won ? '#22c55e' : '#ef4444'}66`, letterSpacing: 4 }}>
            {won ? 'VICTORY!' : 'DEFEAT'}
          </div>
          <div style={{ fontFamily: FONT, fontSize: '0.5rem', color: '#aaa' }}>
            {won ? `You defeated ${selectedOpponent?.name}!` : `${selectedOpponent?.name} got the better of you.`}
          </div>
          <div style={{ fontFamily: FONT, fontSize: '0.55rem', color: '#ffd700', marginTop: 4 }}>
            Your Rank: #{newRank}
          </div>

          {/* Sim results */}
          {lastSimResults.length > 0 && (
            <div style={{ background: panelBg, border: goldBorder, borderRadius: 8, padding: '10px 16px', marginTop: 8 }}>
              <div style={{ fontFamily: FONT, fontSize: '0.4rem', color: '#888', marginBottom: 6 }}>OTHER RESULTS:</div>
              {lastSimResults.map((r, i) => {
                const a = roster.find(f => f.id === r.a);
                const b = roster.find(f => f.id === r.b);
                const w = roster.find(f => f.id === r.winner);
                return (
                  <div key={i} style={{ fontFamily: FONT, fontSize: '0.38rem', color: '#aaa', marginBottom: 3 }}>
                    <span style={{ color: a?.color }}>{a?.name}</span> vs <span style={{ color: b?.color }}>{b?.name}</span>
                    {' → '}<span style={{ color: w?.color }}>{w?.name} WINS</span>
                  </div>
                );
              })}
            </div>
          )}

          <ActionButton onClick={() => setScreen('lobby')}>CONTINUE</ActionButton>
        </div>
      </div>
    );
  }

  return null;
}
