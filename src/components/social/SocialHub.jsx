import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../stores/gameStore';

const GRUDGE_GAMES = [
  { id: 'betta-warlords', name: 'Betta Warlords', icon: '🐟', path: '/play', color: '#06b6d4', desc: 'Tactical underwater RPG' },
  { id: 'gko-boxing', name: 'G.K.O. Boxing', icon: '🥊', path: '/gko-boxing', color: '#ef4444', desc: '1v1 cyberpunk fighter' },
  { id: 'shadow-ops', name: 'Shadow Ops', icon: '🎯', path: '/shadow-ops', color: '#a855f7', desc: 'Top-down survival arena' },
  { id: 'crypt-crawlers', name: 'Crypt Crawlers', icon: '🗡️', path: '/dungeon-crawler', color: '#f59e0b', desc: 'Roguelike dungeon crawler' },
  { id: 'shadow-knights', name: 'Shadow Knights', icon: '⚔️', path: '/demo/shadow-knights', color: '#22c55e', desc: 'Dark fantasy battle demo' },
  { id: 'starbound', name: 'Starbound Corsairs', icon: '🚀', path: '/demo/starbound-corsairs', color: '#3b82f6', desc: 'Space combat demo' },
];

const ACHIEVEMENTS = [
  { id: 'first_battle', name: 'First Blood', desc: 'Play your first game', icon: '⚔️', color: '#ef4444', check: (s) => s.totalGamesPlayed > 0 },
  { id: 'wave_5', name: 'Survivor', desc: 'Reach Wave 5 in Shadow Ops', icon: '🛡️', color: '#22c55e', check: (s) => s.shadowOps.bestWave >= 5 },
  { id: 'wave_10', name: 'Veteran Operative', desc: 'Reach Wave 10 in Shadow Ops', icon: '🎖️', color: '#fbbf24', check: (s) => s.shadowOps.bestWave >= 10 },
  { id: 'ko_master', name: 'KO Master', desc: 'Win 10 G.K.O. matches', icon: '🥊', color: '#f59e0b', check: (s) => s.gko.wins >= 10 },
  { id: 'combo_king', name: 'Combo King', desc: 'Get a 5x combo in Shadow Ops', icon: '🔥', color: '#f97316', check: (s) => s.shadowOps.bestCombo >= 5 },
  { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat 3 bosses in Shadow Ops', icon: '💀', color: '#a855f7', check: (s) => s.shadowOps.bossKills >= 3 },
  { id: 'dungeon_5', name: 'Crypt Diver', desc: 'Reach floor 5 in Crypt Crawlers', icon: '🏚️', color: '#06b6d4', check: (s) => s.crypt.bestFloor >= 5 },
  { id: 'killer_100', name: 'Century', desc: 'Defeat 100 total enemies across all games', icon: '💯', color: '#22d3ee', check: (s) => s.totalKills >= 100 },
  { id: 'killer_500', name: 'Executioner', desc: 'Defeat 500 total enemies', icon: '☠️', color: '#dc2626', check: (s) => s.totalKills >= 500 },
  { id: 'explorer', name: 'Explorer', desc: 'Play 3 different games', icon: '🗺️', color: '#3b82f6', check: (s) => s.uniqueGames >= 3 },
  { id: 'grinder', name: 'Grinder', desc: 'Play 20 total game sessions', icon: '📈', color: '#06b6d4', check: (s) => s.totalGamesPlayed >= 20 },
  { id: 'high_roller', name: 'High Roller', desc: 'Score 1000+ in Shadow Ops', icon: '🏆', color: '#fbbf24', check: (s) => s.shadowOps.highScore >= 1000 },
];

function getCrossGameStats() {
  const stats = {
    shadowOps: { highScore: 0, bestWave: 0, totalKills: 0, gamesPlayed: 0, bestCombo: 0, bossKills: 0 },
    gko: { wins: 0, matches: 0, bestStreak: 0 },
    crypt: { bestFloor: 0, totalKills: 0, gamesPlayed: 0 },
    betta: { level: 0, battles: 0 },
    totalGamesPlayed: 0,
    totalKills: 0,
    uniqueGames: 0,
  };

  try {
    const soScore = parseInt(localStorage.getItem('shadowops_highscore') || '0');
    const soWave = parseInt(localStorage.getItem('shadowops_bestwave') || '0');
    const soStats = JSON.parse(localStorage.getItem('shadowops_stats') || '{}');
    stats.shadowOps = {
      highScore: soScore,
      bestWave: soWave,
      totalKills: soStats.totalKills || 0,
      gamesPlayed: soStats.gamesPlayed || 0,
      bestCombo: soStats.bestCombo || 0,
      bossKills: soStats.bossKills || 0,
    };
  } catch {}

  try {
    const gkoData = JSON.parse(localStorage.getItem('gko_stats') || '{}');
    stats.gko = {
      wins: gkoData.wins || 0,
      matches: gkoData.matches || 0,
      bestStreak: gkoData.bestStreak || 0,
    };
  } catch {}

  try {
    const cryptData = JSON.parse(localStorage.getItem('crypt_stats') || '{}');
    stats.crypt = {
      bestFloor: cryptData.bestFloor || 0,
      totalKills: cryptData.totalKills || 0,
      gamesPlayed: cryptData.gamesPlayed || 0,
    };
  } catch {}

  stats.totalKills = stats.shadowOps.totalKills + stats.crypt.totalKills;
  stats.totalGamesPlayed = stats.shadowOps.gamesPlayed + stats.gko.matches + stats.crypt.gamesPlayed;

  let unique = 0;
  if (stats.shadowOps.gamesPlayed > 0) unique++;
  if (stats.gko.matches > 0) unique++;
  if (stats.crypt.gamesPlayed > 0) unique++;
  stats.uniqueGames = unique;

  return stats;
}

function getStoredProfile() {
  try {
    const raw = localStorage.getItem('grudge_social_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    username: 'Warlord_' + Math.floor(Math.random() * 9999),
    joinDate: new Date().toISOString(),
    friends: [],
  };
}

function saveProfile(profile) {
  try { localStorage.setItem('grudge_social_profile', JSON.stringify(profile)); } catch {}
}

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.3,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.3,
        color: ['#22d3ee', '#a855f7', '#fbbf24'][Math.floor(Math.random() * 3)],
      });
    }
    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }} />;
}

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '16px 20px', flex: '1 1 130px', minWidth: 130, textAlign: 'center',
      transition: 'all 0.3s', cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
      <div style={{ color: color || '#e2e8f0', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ color: '#475569', fontSize: '0.65rem', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function GameStatCard({ game, crossStats }) {
  const gameStats = {
    'shadow-ops': crossStats.shadowOps.gamesPlayed > 0 ? [
      { label: 'High Score', value: crossStats.shadowOps.highScore, color: '#fbbf24' },
      { label: 'Best Wave', value: crossStats.shadowOps.bestWave, color: '#22d3ee' },
      { label: 'Total Kills', value: crossStats.shadowOps.totalKills, color: '#ef4444' },
      { label: 'Best Combo', value: `${crossStats.shadowOps.bestCombo}x`, color: '#f97316' },
    ] : null,
    'gko-boxing': crossStats.gko.matches > 0 ? [
      { label: 'Wins', value: crossStats.gko.wins, color: '#22c55e' },
      { label: 'Matches', value: crossStats.gko.matches, color: '#22d3ee' },
    ] : null,
    'crypt-crawlers': crossStats.crypt.gamesPlayed > 0 ? [
      { label: 'Best Floor', value: crossStats.crypt.bestFloor, color: '#fbbf24' },
      { label: 'Kills', value: crossStats.crypt.totalKills, color: '#ef4444' },
    ] : null,
  };

  const stats = gameStats[game.id];

  return (
    <a href={game.path} style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 20, textDecoration: 'none', display: 'block',
      transition: 'all 0.3s', cursor: 'pointer',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = game.color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${game.color}20`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: '1.8rem' }}>{game.icon}</div>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", color: game.color, fontSize: '1rem' }}>{game.name}</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{game.desc}</div>
        </div>
      </div>
      {stats ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>{s.label}: </span>
              <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 8, fontStyle: 'italic' }}>No data yet — play to track stats!</div>
      )}
      <div style={{
        marginTop: 12, padding: '6px 12px', borderRadius: 6,
        background: `${game.color}15`, color: game.color,
        fontSize: '0.75rem', textAlign: 'center', letterSpacing: 1, fontFamily: "'Cinzel', serif",
      }}>PLAY NOW</div>
    </a>
  );
}

function FeedItem({ message, time, type }) {
  const colors = { system: '#22d3ee', achievement: '#fbbf24', social: '#a855f7', game: '#22c55e', milestone: '#f97316' };
  return (
    <div style={{
      padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', marginTop: 6,
        background: colors[type] || '#64748b', flexShrink: 0,
        boxShadow: `0 0 6px ${colors[type] || '#64748b'}60`,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>{message}</div>
        <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: 4 }}>{time}</div>
      </div>
    </div>
  );
}

function ShareCodePanel({ profile, crossStats }) {
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [copied, setCopied] = useState(false);

  const generateShareCode = () => {
    const data = {
      username: profile.username,
      stats: {
        totalKills: crossStats.totalKills,
        gamesPlayed: crossStats.totalGamesPlayed,
        soHighScore: crossStats.shadowOps.highScore,
        soWave: crossStats.shadowOps.bestWave,
        gkoWins: crossStats.gko.wins,
        cryptFloor: crossStats.crypt.bestFloor,
      },
      achievements: ACHIEVEMENTS.filter(a => a.check(crossStats)).map(a => a.id),
      ts: Date.now(),
    };
    const encoded = btoa(JSON.stringify(data));
    setShareCode(`GS:${encoded}`);
  };

  const copyCode = () => {
    if (shareCode) {
      navigator.clipboard?.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = () => {
    try {
      if (!importCode.startsWith('GS:')) throw new Error('Invalid code');
      const data = JSON.parse(atob(importCode.slice(3)));
      const achCount = data.achievements?.length || 0;
      setImportStatus(`Connected with ${data.username} — ${data.stats?.totalKills || 0} kills, ${achCount} achievements`);
    } catch {
      setImportStatus('Invalid share code');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      border: '1px solid rgba(34,211,238,0.15)',
      borderRadius: 12, padding: 20,
    }}>
      <h3 style={{ fontFamily: "'Cinzel', serif", color: '#fbbf24', fontSize: '1rem', marginBottom: 16, margin: 0 }}>
        Grudge Studio Connection
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 12, lineHeight: 1.5 }}>
        Share your profile and stats with other Grudge Studios players. Generate a code to share, or import a friend's code to connect.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={generateShareCode} style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(6,182,212,0.15))',
          border: '1px solid #22d3ee',
          borderRadius: 8, padding: '10px 20px', color: '#22d3ee',
          fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Cinzel', serif",
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.target.style.background = 'rgba(34,211,238,0.3)'}
        onMouseLeave={e => e.target.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(6,182,212,0.15))'}
        >Generate Share Code</button>
      </div>
      {shareCode && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 4 }}>Your Share Code:</div>
          <div onClick={copyCode} style={{
            background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8,
            fontFamily: 'monospace', fontSize: '0.7rem', color: '#22d3ee',
            wordBreak: 'break-all', cursor: 'pointer',
            border: copied ? '1px solid #22c55e' : '1px solid rgba(34,211,238,0.2)',
            transition: 'border 0.3s',
          }}>
            {shareCode}
          </div>
          <div style={{ color: copied ? '#22c55e' : '#475569', fontSize: '0.65rem', marginTop: 4 }}>
            {copied ? 'Copied to clipboard!' : 'Click to copy'}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={importCode}
          onChange={e => setImportCode(e.target.value)}
          placeholder="Paste share code (GS:...)"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '10px 14px', color: '#e2e8f0',
            fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#a855f7'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button onClick={handleImport} style={{
          background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7',
          borderRadius: 8, padding: '10px 16px', color: '#a855f7',
          fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Cinzel', serif",
        }}>Connect</button>
      </div>
      {importStatus && (
        <div style={{ color: importStatus.includes('Invalid') ? '#ef4444' : '#22c55e', fontSize: '0.8rem', marginTop: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
          {importStatus}
        </div>
      )}
    </div>
  );
}

function LeaderboardTab({ crossStats }) {
  const entries = [];

  if (crossStats.shadowOps.highScore > 0) {
    entries.push({ game: 'Shadow Ops', metric: 'High Score', value: crossStats.shadowOps.highScore, color: '#a855f7', icon: '🎯' });
  }
  if (crossStats.shadowOps.bestWave > 0) {
    entries.push({ game: 'Shadow Ops', metric: 'Best Wave', value: crossStats.shadowOps.bestWave, color: '#22d3ee', icon: '🎯' });
  }
  if (crossStats.shadowOps.bestCombo > 0) {
    entries.push({ game: 'Shadow Ops', metric: 'Best Combo', value: `${crossStats.shadowOps.bestCombo}x`, color: '#f97316', icon: '🎯' });
  }
  if (crossStats.gko.wins > 0) {
    entries.push({ game: 'G.K.O. Boxing', metric: 'Wins', value: crossStats.gko.wins, color: '#ef4444', icon: '🥊' });
  }
  if (crossStats.crypt.bestFloor > 0) {
    entries.push({ game: 'Crypt Crawlers', metric: 'Best Floor', value: crossStats.crypt.bestFloor, color: '#f59e0b', icon: '🗡️' });
  }
  if (crossStats.totalKills > 0) {
    entries.push({ game: 'All Games', metric: 'Total Kills', value: crossStats.totalKills, color: '#22c55e', icon: '💀' });
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(251,191,36,0.15)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontFamily: "'Cinzel', serif", color: '#fbbf24', fontSize: '1rem',
          background: 'rgba(251,191,36,0.05)',
        }}>Personal Records</div>
        {entries.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
            No records yet. Play some games to see your stats here!
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={i} style={{
              padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: '1.2rem' }}>{entry.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{entry.metric}</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{entry.game}</div>
              </div>
              <div style={{ color: entry.color, fontFamily: "'Cinzel', serif", fontSize: '1.2rem', fontWeight: 700 }}>
                {entry.value}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{
        marginTop: 20, background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(34,211,238,0.15)',
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", color: '#22d3ee', fontSize: '0.9rem', marginBottom: 12 }}>
          Lifetime Stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Games Played', value: crossStats.totalGamesPlayed, color: '#22d3ee' },
            { label: 'Total Kills', value: crossStats.totalKills, color: '#ef4444' },
            { label: 'Games Tried', value: `${crossStats.uniqueGames}/6`, color: '#a855f7' },
            { label: 'Achievements', value: ACHIEVEMENTS.filter(a => a.check(crossStats)).length, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ color: s.color, fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SocialHub() {
  const [profile, setProfile] = useState(getStoredProfile);
  const [tab, setTab] = useState('overview');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.username);
  const [crossStats, setCrossStats] = useState(getCrossGameStats);

  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => {
    const interval = setInterval(() => setCrossStats(getCrossGameStats()), 5000);
    return () => clearInterval(interval);
  }, []);

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(crossStats));
  const playerLevel = Math.max(1, Math.floor(crossStats.totalGamesPlayed / 3) + unlockedAchievements.length + 1);

  const saveName = () => {
    if (nameInput.trim()) {
      setProfile(s => ({ ...s, username: nameInput.trim() }));
      setEditingName(false);
    }
  };

  const activityFeed = [];
  if (crossStats.shadowOps.gamesPlayed > 0)
    activityFeed.push({ message: `Shadow Ops: ${crossStats.shadowOps.totalKills} kills across ${crossStats.shadowOps.gamesPlayed} sessions. Best wave: ${crossStats.shadowOps.bestWave}.`, time: 'Latest session', type: 'game' });
  if (crossStats.gko.matches > 0)
    activityFeed.push({ message: `G.K.O. Boxing: ${crossStats.gko.wins} wins in ${crossStats.gko.matches} matches.`, time: 'Latest session', type: 'game' });
  if (crossStats.crypt.gamesPlayed > 0)
    activityFeed.push({ message: `Crypt Crawlers: Reached floor ${crossStats.crypt.bestFloor} with ${crossStats.crypt.totalKills} kills.`, time: 'Latest session', type: 'game' });
  if (unlockedAchievements.length > 0)
    activityFeed.push({ message: `Unlocked ${unlockedAchievements.length} achievement${unlockedAchievements.length > 1 ? 's' : ''}: ${unlockedAchievements.slice(0, 3).map(a => a.name).join(', ')}${unlockedAchievements.length > 3 ? '...' : ''}`, time: 'Achievements', type: 'achievement' });
  activityFeed.push({ message: 'Welcome to Grudge Studios Social Hub! Play games to track your stats.', time: 'System', type: 'system' });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'games', label: 'Games', icon: '🎮' },
    { id: 'leaderboard', label: 'Records', icon: '🏆' },
    { id: 'achievements', label: 'Achievements', icon: '🎖️' },
    { id: 'connect', label: 'Connect', icon: '🔗' },
  ];

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'linear-gradient(180deg, #050a18 0%, #0a1628 50%, #0f1d30 100%)',
      fontFamily: "'Jost', sans-serif", color: '#e2e8f0',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <ParticleBackground />

      <div style={{
        background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(34,211,238,0.1)',
        padding: '20px 24px', textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: 0, letterSpacing: 3,
        }}>GRUDGE STUDIOS</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0', letterSpacing: 2 }}>
          SOCIAL HUB
        </p>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.3)', padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontFamily: "'Cinzel', serif", fontWeight: 700,
          border: '3px solid rgba(255,255,255,0.15)',
          color: '#fff', boxShadow: '0 0 15px rgba(6,182,212,0.3)',
        }}>
          {profile.username[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          {editingName ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                style={{
                  background: 'rgba(0,0,0,0.4)', border: '1px solid #22d3ee',
                  borderRadius: 6, padding: '4px 10px', color: '#e2e8f0',
                  fontSize: '1rem', fontFamily: "'Cinzel', serif", outline: 'none', width: 160,
                }}
                autoFocus
              />
              <button onClick={saveName} style={{
                background: 'rgba(34,211,238,0.2)', border: '1px solid #22d3ee',
                borderRadius: 6, padding: '4px 12px', color: '#22d3ee', cursor: 'pointer', fontSize: '0.8rem',
              }}>Save</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: '#e2e8f0' }}>
                {profile.username}
              </span>
              <button onClick={() => { setEditingName(true); setNameInput(profile.username); }} style={{
                background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem',
              }}>edit</button>
            </div>
          )}
          <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>Level {playerLevel}</span>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ color: '#fbbf24' }}>{unlockedAchievements.length}/{ACHIEVEMENTS.length} Achievements</span>
            <span style={{ color: '#475569' }}>|</span>
            <button onClick={() => window.location.href = '/avatar'} style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.15))',
              border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '2px 10px',
              color: '#a855f7', cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Jost', sans-serif",
            }}>🎨 Avatar</button>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(0,0,0,0.15)', overflowX: 'auto',
        position: 'relative', zIndex: 1,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: '1 1 auto', padding: '12px 14px', background: 'none', border: 'none',
            borderBottom: tab === t.id ? '2px solid #22d3ee' : '2px solid transparent',
            color: tab === t.id ? '#22d3ee' : '#64748b', cursor: 'pointer',
            fontSize: '0.82rem', fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        {tab === 'overview' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <StatCard label="GAMES PLAYED" value={crossStats.totalGamesPlayed} color="#22d3ee" icon="🎮" sub={`${crossStats.uniqueGames} unique`} />
              <StatCard label="TOTAL KILLS" value={crossStats.totalKills} color="#ef4444" icon="💀" />
              <StatCard label="ACHIEVEMENTS" value={`${unlockedAchievements.length}/${ACHIEVEMENTS.length}`} color="#fbbf24" icon="🏆" />
              <StatCard label="LEVEL" value={playerLevel} color="#a855f7" icon="⭐" />
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontFamily: "'Cinzel', serif", color: '#fbbf24', fontSize: '0.9rem',
                background: 'rgba(251,191,36,0.03)',
              }}>Activity Feed</div>
              {activityFeed.map((item, i) => (
                <FeedItem key={i} {...item} />
              ))}
            </div>
          </div>
        )}

        {tab === 'games' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {GRUDGE_GAMES.map(game => (
                <GameStatCard key={game.id} game={game} crossStats={crossStats} />
              ))}
            </div>
          </div>
        )}

        {tab === 'leaderboard' && <LeaderboardTab crossStats={crossStats} />}

        {tab === 'achievements' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <span style={{ color: '#fbbf24', fontFamily: "'Cinzel', serif", fontSize: '1.1rem' }}>
                {unlockedAchievements.length}
              </span>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}> / {ACHIEVEMENTS.length} unlocked</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {ACHIEVEMENTS.map(ach => {
                const unlocked = ach.check(crossStats);
                return (
                  <div key={ach.id} style={{
                    background: unlocked ? 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${unlocked ? ach.color + '50' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    opacity: unlocked ? 1 : 0.5,
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { if (unlocked) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: unlocked ? `${ach.color}20` : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', border: `2px solid ${unlocked ? ach.color : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: unlocked ? `0 0 10px ${ach.color}30` : 'none',
                    }}>{ach.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: unlocked ? ach.color : '#64748b', fontFamily: "'Cinzel', serif", fontSize: '0.9rem' }}>
                        {ach.name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{ach.desc}</div>
                    </div>
                    {unlocked && <div style={{ color: '#22c55e', fontSize: '1.2rem', textShadow: '0 0 6px rgba(34,197,94,0.5)' }}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'connect' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <ShareCodePanel profile={profile} crossStats={crossStats} />

            <div style={{
              marginTop: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(168,85,247,0.15)',
              borderRadius: 12, padding: 20,
            }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#a855f7', fontSize: '1rem', margin: '0 0 12px' }}>
                GRUDA Arena Link
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                Export your heroes from Betta Warlords to the GRUDA Arena for standalone battles.
                Share your hero data with friends using share codes.
              </p>
              <a href="/arena" style={{
                display: 'inline-block', background: 'rgba(168,85,247,0.15)',
                border: '1px solid #a855f7', borderRadius: 8,
                padding: '8px 20px', color: '#a855f7', textDecoration: 'none',
                fontSize: '0.85rem', fontFamily: "'Cinzel', serif",
              }}>Open GRUDA Arena</a>
            </div>

            <div style={{
              marginTop: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(34,211,238,0.15)',
              borderRadius: 12, padding: 20,
            }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#22d3ee', fontSize: '1rem', margin: '0 0 12px' }}>
                Discord Community
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                Join the Grudge Studios Discord to connect with other players,
                share strategies, and stay updated on new games and features.
              </p>
              <a href="/discordauth" style={{
                display: 'inline-block', background: 'rgba(88,101,242,0.15)',
                border: '1px solid #5865F2', borderRadius: 8,
                padding: '8px 20px', color: '#5865F2', textDecoration: 'none',
                fontSize: '0.85rem', fontFamily: "'Cinzel', serif",
              }}>Connect Discord</a>
            </div>

            <div style={{
              marginTop: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(251,191,36,0.15)',
              borderRadius: 12, padding: 20,
            }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#fbbf24', fontSize: '1rem', margin: '0 0 12px' }}>
                GBuX Wallet
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                GBuX is the universal currency across all Grudge Studios games.
                Earn through gameplay, trade on exchanges, or purchase directly.
              </p>
              <a href="/gbux" style={{
                display: 'inline-block', background: 'rgba(251,191,36,0.15)',
                border: '1px solid #fbbf24', borderRadius: 8,
                padding: '8px 20px', color: '#fbbf24', textDecoration: 'none',
                fontSize: '0.85rem', fontFamily: "'Cinzel', serif",
              }}>View GBuX</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
