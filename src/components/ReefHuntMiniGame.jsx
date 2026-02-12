import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playClick, playHurt } from '../utils/audioManager';

const GAME_DURATION = 45;
const MAX_ENERGY = 100;
const SPAWN_INTERVAL = 1200;
const PREDATOR_SPAWN_INTERVAL = 8000;
const COLLECT_RADIUS = 38;
const PREDATOR_HURT_RADIUS = 32;
const PREDATOR_WARN_RADIUS = 80;
const INVULN_TIME = 1500;

const COLLECTIBLES = [
  { type: 'pearl', resource: 'gold', amount: 1, color: '#fbbf24', emoji: '🫧', size: 14, speed: 0.3, energy: 5, weight: 25 },
  { type: 'algae', resource: 'herbs', amount: 1, color: '#4ade80', emoji: '🌿', size: 12, speed: 0.2, energy: 8, weight: 25 },
  { type: 'coral', resource: 'wood', amount: 1, color: '#22d3ee', emoji: '🪸', size: 14, speed: 0.15, energy: 4, weight: 20 },
  { type: 'shell', resource: 'ore', amount: 1, color: '#94a3b8', emoji: '🐚', size: 16, speed: 0.25, energy: 3, weight: 15 },
  { type: 'crystal', resource: 'crystals', amount: 1, color: '#a78bfa', emoji: '💎', size: 12, speed: 0.35, energy: 6, weight: 8 },
  { type: 'plankton', resource: null, amount: 0, color: '#86efac', emoji: '✨', size: 8, speed: 0.1, energy: 12, weight: 30 },
  { type: 'shrimp', resource: 'gold', amount: 2, color: '#fb923c', emoji: '🦐', size: 16, speed: 0.5, energy: 10, weight: 10 },
  { type: 'starfish', resource: null, amount: 0, color: '#f472b6', emoji: '⭐', size: 18, speed: 0.08, energy: 15, weight: 5, buff: 'luck' },
];

const PREDATORS = [
  { type: 'shark', emoji: '🦈', size: 36, speed: 1.2, color: '#64748b', damage: 25 },
  { type: 'eel', emoji: '🐍', size: 28, speed: 1.5, color: '#7c3aed', damage: 15 },
  { type: 'jellyfish', emoji: '🪼', size: 24, speed: 0.6, color: '#c084fc', damage: 10 },
];

const BUFF_TYPES = {
  luck: { label: 'Lucky Catch', desc: '+20% rare drops for 3 battles', icon: 'sparkle', color: '#f472b6', duration: 3 },
};

function weightedRandom(items) {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[0];
}

function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, t);
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export default function ReefHuntMiniGame({ onClose, onComplete, heroSprite }) {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    running: false,
    mouseX: 400,
    mouseY: 300,
    fishX: 400,
    fishY: 300,
    fishVx: 0,
    fishVy: 0,
    facingLeft: false,
    energy: MAX_ENERGY,
    timer: GAME_DURATION,
    collectibles: [],
    predators: [],
    particles: [],
    collected: { gold: 0, herbs: 0, wood: 0, ore: 0, crystals: 0 },
    totalCollected: 0,
    combo: 0,
    comboTimer: 0,
    lastSpawn: 0,
    lastPredatorSpawn: 0,
    lastTime: 0,
    invulnUntil: 0,
    hits: 0,
    buffsEarned: [],
    sizeLevel: 1,
    flashUntil: 0,
    shakeUntil: 0,
    bubbles: [],
    score: 0,
  });
  const rafRef = useRef(null);
  const [gameState, setGameState] = useState('playing');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayEnergy, setDisplayEnergy] = useState(MAX_ENERGY);
  const [displayTimer, setDisplayTimer] = useState(GAME_DURATION);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [displayCollected, setDisplayCollected] = useState({ gold: 0, herbs: 0, wood: 0, ore: 0, crystals: 0 });
  const [results, setResults] = useState(null);

  const spawnCollectible = useCallback(() => {
    const template = weightedRandom(COLLECTIBLES);
    const side = Math.random();
    let x, y, vx, vy;
    if (side < 0.25) { x = -20; y = Math.random() * 500 + 50; vx = template.speed; vy = (Math.random() - 0.5) * 0.3; }
    else if (side < 0.5) { x = 820; y = Math.random() * 500 + 50; vx = -template.speed; vy = (Math.random() - 0.5) * 0.3; }
    else if (side < 0.75) { x = Math.random() * 700 + 50; y = -20; vx = (Math.random() - 0.5) * 0.3; vy = template.speed; }
    else { x = Math.random() * 700 + 50; y = 620; vx = (Math.random() - 0.5) * 0.3; vy = -template.speed; }

    return {
      ...template,
      id: Date.now() + Math.random(),
      x, y, vx, vy,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
      alpha: 1,
    };
  }, []);

  const spawnPredator = useCallback(() => {
    const template = PREDATORS[Math.floor(Math.random() * PREDATORS.length)];
    const side = Math.random() < 0.5;
    const x = side ? -40 : 840;
    const y = Math.random() * 400 + 100;
    return {
      ...template,
      id: Date.now() + Math.random(),
      x, y,
      vx: side ? template.speed * 0.5 : -template.speed * 0.5,
      vy: 0,
      phase: 'wander',
      wanderTimer: 3000 + Math.random() * 2000,
      alpha: 1,
    };
  }, []);

  const addParticle = useCallback((x, y, color, text) => {
    const g = gameRef.current;
    g.particles.push({
      x, y, text, color,
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random(),
      life: 1,
      id: Date.now() + Math.random(),
    });
  }, []);

  const addBubble = useCallback((x, y) => {
    const g = gameRef.current;
    for (let i = 0; i < 3; i++) {
      g.bubbles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        size: 2 + Math.random() * 4,
        vy: -0.5 - Math.random() * 0.5,
        alpha: 0.6,
        id: Date.now() + Math.random() + i,
      });
    }
  }, []);

  const handleClick = useCallback((e) => {
    const g = gameRef.current;
    if (!g.running) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 600;

    let ate = false;
    g.collectibles = g.collectibles.filter(c => {
      const d = dist(g.fishX, g.fishY, c.x, c.y);
      if (d < COLLECT_RADIUS + c.size) {
        if (c.resource) {
          g.collected[c.resource] = (g.collected[c.resource] || 0) + c.amount * g.sizeLevel;
        }
        g.energy = Math.min(MAX_ENERGY, g.energy + c.energy);
        g.totalCollected++;
        g.combo++;
        g.comboTimer = 2;
        g.score += (10 + g.combo * 5) * g.sizeLevel;

        if (g.totalCollected % 15 === 0 && g.sizeLevel < 3) {
          g.sizeLevel++;
          addParticle(g.fishX, g.fishY - 20, '#22d3ee', 'SIZE UP!');
        }

        if (c.buff) {
          g.buffsEarned.push(c.buff);
          addParticle(c.x, c.y - 10, BUFF_TYPES[c.buff].color, BUFF_TYPES[c.buff].label);
        } else {
          addParticle(c.x, c.y - 10, c.color, `+${c.amount * g.sizeLevel} ${c.type}`);
        }
        addBubble(c.x, c.y);
        ate = true;
        try { playClick(); } catch(e) {}
        return false;
      }
      return true;
    });

    if (!ate) {
      addBubble(g.fishX + (g.facingLeft ? -15 : 15), g.fishY - 5);
      g.combo = 0;
    }
  }, [addParticle, addBubble]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    gameRef.current.mouseX = ((e.clientX - rect.left) / rect.width) * 800;
    gameRef.current.mouseY = ((e.clientY - rect.top) / rect.height) * 600;
  }, []);

  useEffect(() => {
    const g = gameRef.current;
    g.running = true;
    g.lastTime = performance.now();

    for (let i = 0; i < 8; i++) {
      g.collectibles.push(spawnCollectible());
    }

    const gameLoop = (now) => {
      if (!g.running) return;
      const dt = Math.min((now - g.lastTime) / 1000, 0.05);
      g.lastTime = now;

      g.timer -= dt;
      g.energy -= dt * 2.5;
      g.comboTimer -= dt;
      if (g.comboTimer <= 0) g.combo = 0;

      if (g.timer <= 0 || g.energy <= 0) {
        g.running = false;
        const finalResults = {
          resources: { ...g.collected },
          score: g.score,
          totalCollected: g.totalCollected,
          buffs: [...g.buffsEarned],
          sizeLevel: g.sizeLevel,
        };
        setResults(finalResults);
        setGameState('results');
        return;
      }

      const dx = g.mouseX - g.fishX;
      const dy = g.mouseY - g.fishY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 3) {
        const accel = Math.min(d * 0.008, 4);
        g.fishVx = lerp(g.fishVx, (dx / d) * accel, 0.12);
        g.fishVy = lerp(g.fishVy, (dy / d) * accel, 0.12);
        g.facingLeft = dx < 0;
      } else {
        g.fishVx *= 0.9;
        g.fishVy *= 0.9;
      }
      g.fishX += g.fishVx;
      g.fishY += g.fishVy;
      g.fishX = Math.max(20, Math.min(780, g.fishX));
      g.fishY = Math.max(20, Math.min(580, g.fishY));

      if (now - g.lastSpawn > SPAWN_INTERVAL && g.collectibles.length < 15) {
        g.collectibles.push(spawnCollectible());
        g.lastSpawn = now;
      }

      if (now - g.lastPredatorSpawn > PREDATOR_SPAWN_INTERVAL && g.predators.length < 3) {
        g.predators.push(spawnPredator());
        g.lastPredatorSpawn = now;
      }

      g.collectibles.forEach(c => {
        c.wobble += c.wobbleSpeed;
        c.x += c.vx + Math.sin(c.wobble) * 0.3;
        c.y += c.vy + Math.cos(c.wobble * 0.7) * 0.2;
      });
      g.collectibles = g.collectibles.filter(c =>
        c.x > -40 && c.x < 840 && c.y > -40 && c.y < 640
      );

      g.predators.forEach(p => {
        const pd = dist(g.fishX, g.fishY, p.x, p.y);
        if (pd < PREDATOR_WARN_RADIUS * 2 && p.phase === 'wander') {
          p.phase = 'chase';
        }
        if (p.phase === 'chase') {
          const pdx = g.fishX - p.x;
          const pdy = g.fishY - p.y;
          const pdd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
          p.vx = lerp(p.vx, (pdx / pdd) * p.speed, 0.04);
          p.vy = lerp(p.vy, (pdy / pdd) * p.speed, 0.04);
        } else {
          p.wanderTimer -= dt * 1000;
          if (p.wanderTimer <= 0) {
            p.vx = (Math.random() - 0.5) * p.speed;
            p.vy = (Math.random() - 0.5) * p.speed * 0.5;
            p.wanderTimer = 2000 + Math.random() * 3000;
          }
        }
        p.x += p.vx;
        p.y += p.vy;

        if (pd < PREDATOR_HURT_RADIUS && now > g.invulnUntil) {
          g.energy -= p.damage;
          g.hits++;
          g.invulnUntil = now + INVULN_TIME;
          g.shakeUntil = now + 300;
          g.combo = 0;
          addParticle(g.fishX, g.fishY - 15, '#ef4444', `-${p.damage} Energy!`);
          try { playHurt(); } catch(e) {}
        }
      });
      g.predators = g.predators.filter(p =>
        p.x > -80 && p.x < 880 && p.y > -60 && p.y < 660
      );

      g.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * 1.5;
      });
      g.particles = g.particles.filter(p => p.life > 0);

      g.bubbles.forEach(b => {
        b.y += b.vy;
        b.x += Math.sin(b.y * 0.05) * 0.3;
        b.alpha -= dt * 0.5;
      });
      g.bubbles = g.bubbles.filter(b => b.alpha > 0);

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) render(ctx, g, now);

      setDisplayScore(g.score);
      setDisplayEnergy(Math.max(0, Math.floor(g.energy)));
      setDisplayTimer(Math.max(0, Math.ceil(g.timer)));
      setDisplayCombo(g.combo);
      setDisplayCollected({ ...g.collected });

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      g.running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spawnCollectible, spawnPredator, addParticle, addBubble]);

  function render(ctx, g, now) {
    ctx.clearRect(0, 0, 800, 600);

    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(0.4, '#0e3a5c');
    grad.addColorStop(1, '#041225');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    const time = now * 0.001;
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 5; i++) {
      const lx = Math.sin(time * 0.3 + i) * 400 + 400;
      const ly = i * 130;
      const lgr = ctx.createRadialGradient(lx, ly, 0, lx, ly, 200);
      lgr.addColorStop(0, '#22d3ee');
      lgr.addColorStop(1, 'transparent');
      ctx.fillStyle = lgr;
      ctx.fillRect(0, 0, 800, 600);
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x <= 800; x += 10) {
        const y = Math.sin(x * 0.005 + time * 0.5 + i * 2) * 20 + 100 + i * 180;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    g.bubbles.forEach(b => {
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34,211,238,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = b.alpha * 0.2;
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    g.collectibles.forEach(c => {
      ctx.save();
      const bob = Math.sin(c.wobble) * 3;
      ctx.globalAlpha = c.alpha;

      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.font = `${c.size + 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.emoji, c.x, c.y + bob);
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    g.predators.forEach(p => {
      ctx.save();
      const bob = Math.sin(now * 0.003 + p.id) * 4;
      ctx.globalAlpha = 0.9;

      if (p.phase === 'chase') {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      }

      const flip = p.vx < 0;
      ctx.translate(p.x, p.y + bob);
      if (flip) ctx.scale(-1, 1);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);

      ctx.shadowBlur = 0;
      ctx.restore();
    });

    const isInvuln = now < g.invulnUntil;
    const shake = now < g.shakeUntil;
    ctx.save();
    if (shake) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    if (isInvuln) {
      ctx.globalAlpha = 0.5 + Math.sin(now * 0.02) * 0.3;
    }

    const fishSize = 20 + g.sizeLevel * 6;
    ctx.translate(g.fishX, g.fishY);
    if (g.facingLeft) ctx.scale(-1, 1);

    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, fishSize, fishSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0e7490';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-fishSize * 0.8, 0);
    ctx.lineTo(-fishSize * 1.3, -fishSize * 0.4);
    ctx.lineTo(-fishSize * 1.3, fishSize * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(fishSize * 0.4, -fishSize * 0.15, fishSize * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#041225';
    ctx.beginPath();
    ctx.arc(fishSize * 0.45, -fishSize * 0.15, fishSize * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -fishSize * 0.5);
    ctx.lineTo(-fishSize * 0.3, -fishSize * 0.9);
    ctx.lineTo(fishSize * 0.1, -fishSize * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    g.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.font = 'bold 13px "Jost", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  const handleComplete = () => {
    if (results) {
      onComplete(results);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 11000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div style={{
        position: 'relative', width: '90%', maxWidth: 800,
        borderRadius: 12, overflow: 'hidden',
        border: '2px solid rgba(34,211,238,0.4)',
        boxShadow: '0 0 40px rgba(34,211,238,0.2)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px',
          background: 'linear-gradient(90deg, rgba(4,18,37,0.95), rgba(14,58,92,0.95))',
          borderBottom: '1px solid rgba(34,211,238,0.2)',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.8rem', fontWeight: 700 }}>REEF HUNT</span>
            <span style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: 600 }}>Score: {displayScore}</span>
            {displayCombo > 1 && (
              <span style={{ color: '#f97316', fontSize: '0.6rem', fontWeight: 700, animation: 'pulse 0.5s infinite' }}>
                x{displayCombo} COMBO
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#4ade80', fontSize: '0.6rem' }}>Energy</span>
              <div style={{ width: 80, height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, transition: 'width 0.2s',
                  width: `${(displayEnergy / MAX_ENERGY) * 100}%`,
                  background: displayEnergy > 30 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #ef4444, #f97316)',
                }} />
              </div>
            </div>
            <span style={{
              color: displayTimer <= 10 ? '#ef4444' : '#94a3b8', fontSize: '0.7rem', fontWeight: 700,
              fontFamily: 'monospace',
            }}>
              {displayTimer}s
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4, padding: '2px 8px', color: '#ef4444', cursor: 'pointer',
              fontSize: '0.55rem', fontWeight: 600,
            }}>EXIT</button>
          </div>
        </div>

        {gameState === 'playing' && (
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            style={{
              width: '100%', display: 'block', cursor: 'none',
              aspectRatio: '800 / 600',
            }}
          />
        )}

        {gameState === 'results' && results && (
          <div style={{
            width: '100%', aspectRatio: '800 / 600',
            background: 'linear-gradient(180deg, #0c4a6e, #041225)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: 24,
          }}>
            <h2 className="font-cinzel" style={{
              color: '#22d3ee', fontSize: '1.5rem', margin: 0,
              textShadow: '0 0 20px rgba(34,211,238,0.5)',
            }}>Reef Hunt Complete!</h2>

            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 16,
              border: '1px solid rgba(34,211,238,0.2)', minWidth: 280,
            }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 700 }}>Score: {results.score}</span>
                <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: 8 }}>
                  ({results.totalCollected} collected, Size Lv.{results.sizeLevel})
                </span>
              </div>

              <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Resources Earned</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
                {Object.entries(results.resources).map(([key, val]) => (
                  <div key={key} style={{
                    textAlign: 'center', padding: '6px 4px',
                    background: val > 0 ? 'rgba(34,211,238,0.1)' : 'rgba(0,0,0,0.2)',
                    borderRadius: 6, border: `1px solid ${val > 0 ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: val > 0 ? '#22d3ee' : '#555' }}>{val}</div>
                    <div style={{ fontSize: '0.45rem', color: '#888', textTransform: 'capitalize' }}>
                      {key === 'gold' ? 'Pearls' : key === 'herbs' ? 'Algae' : key === 'wood' ? 'Coral' : key === 'ore' ? 'Shells' : key}
                    </div>
                  </div>
                ))}
              </div>

              {results.buffs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Buffs Earned</div>
                  {results.buffs.map((b, i) => (
                    <div key={i} style={{
                      padding: '4px 8px', background: 'rgba(244,114,182,0.15)',
                      border: '1px solid rgba(244,114,182,0.3)', borderRadius: 4,
                      color: '#f472b6', fontSize: '0.6rem', fontWeight: 600,
                    }}>
                      {BUFF_TYPES[b]?.label} - {BUFF_TYPES[b]?.desc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleComplete} className="font-cinzel" style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(6,182,212,0.2))',
              border: '2px solid rgba(34,211,238,0.5)', borderRadius: 8,
              padding: '10px 32px', color: '#22d3ee', fontSize: '0.85rem',
              fontWeight: 700, cursor: 'pointer', letterSpacing: 2,
              transition: 'all 0.2s',
            }}>
              COLLECT REWARDS
            </button>
          </div>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '4px 12px',
          background: 'linear-gradient(90deg, rgba(4,18,37,0.95), rgba(14,58,92,0.95))',
          borderTop: '1px solid rgba(34,211,238,0.2)',
        }}>
          {Object.entries(displayCollected).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: '0.5rem', color: '#888', textTransform: 'capitalize' }}>
                {key === 'gold' ? '🫧' : key === 'herbs' ? '🌿' : key === 'wood' ? '🪸' : key === 'ore' ? '🐚' : '💎'}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#22d3ee', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {gameState === 'playing' && (
        <div style={{
          marginTop: 8, color: '#64748b', fontSize: '0.55rem', textAlign: 'center',
        }}>
          Move mouse to swim &bull; Click to snap at nearby food &bull; Avoid predators &bull; Collect resources!
        </div>
      )}
    </div>
  );
}