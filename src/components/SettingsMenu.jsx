import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import { EssentialIcon } from '../data/uiSprites';
import {
  setMusicMuted, setSfxMuted, setMusicVolume, setSfxVolume,
  getMusicMuted, getSfxMuted, getMusicVolume, getSfxVolume,
  playClick,
} from '../utils/audioManager';

const STORAGE_KEY = 'bw-settings';
function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}
function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [musicOff, setMusicOff] = useState(getMusicMuted());
  const [sfxOff, setSfxOff] = useState(getSfxMuted());
  const [musicVol, setMusicVol] = useState(getMusicVolume());
  const [sfxVol, setSfxVol] = useState(getSfxVolume());
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [reducedMotion, setReducedMotion] = useState(() => loadSettings().reducedMotion || false);
  const [textSize, setTextSize] = useState(() => loadSettings().textSize || 'normal');
  const [screenShake, setScreenShake] = useState(() => loadSettings().screenShake !== false);
  const [showFps, setShowFps] = useState(() => loadSettings().showFps || false);

  const resetGame = useGameStore(s => s.resetGame);
  const screen = useGameStore(s => s.screen);
  const playerName = useGameStore(s => s.playerName);
  const level = useGameStore(s => s.level);
  const victories = useGameStore(s => s.victories);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setConfirmReset(false);
  }, [screen]);

  useEffect(() => {
    const handler = () => setOpen(prev => !prev);
    window.addEventListener('toggle-settings', handler);
    return () => window.removeEventListener('toggle-settings', handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const scale = textSize === 'small' ? '0.9' : textSize === 'large' ? '1.15' : '1';
    root.style.setProperty('--bw-text-scale', scale);
    if (reducedMotion) {
      root.classList.add('bw-reduced-motion');
    } else {
      root.classList.remove('bw-reduced-motion');
    }
    window.__bwScreenShake = screenShake;
    window.__bwShowFps = showFps;
    saveSettings({ reducedMotion, textSize, screenShake, showFps });
  }, [reducedMotion, textSize, screenShake, showFps]);

  const handleMusicToggle = useCallback(() => {
    const next = !musicOff;
    setMusicOff(next);
    setMusicMuted(next);
  }, [musicOff]);

  const handleSfxToggle = () => {
    const next = !sfxOff;
    setSfxOff(next);
    setSfxMuted(next);
    if (!next) playClick();
  };

  const handleMusicVol = (e) => {
    const v = parseFloat(e.target.value);
    setMusicVol(v);
    setMusicVolume(v);
  };

  const handleSfxVol = (e) => {
    const v = parseFloat(e.target.value);
    setSfxVol(v);
    setSfxVolume(v);
  };

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetGame();
    setOpen(false);
    setConfirmReset(false);
  };

  const quickMusicToggle = () => {
    const next = !musicOff;
    setMusicOff(next);
    setMusicMuted(next);
  };

  const toggleStyle = (active) => ({
    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: active ? 'var(--accent)' : 'rgba(100,100,100,0.4)',
    position: 'relative', transition: 'background 0.2s',
    display: 'inline-flex', alignItems: 'center', padding: 2,
  });

  const toggleKnob = (active) => ({
    width: 20, height: 20, borderRadius: '50%',
    background: '#fff', transition: 'transform 0.2s',
    transform: active ? 'translateX(20px)' : 'translateX(0)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
  });

  const sliderStyle = {
    width: '100%', height: 6, appearance: 'none', background: 'rgba(255,255,255,0.15)',
    borderRadius: 3, outline: 'none', cursor: 'pointer',
    accentColor: 'var(--accent)',
  };

  const topBtnStyle = (active) => ({
    width: 40, height: 40, borderRadius: 10,
    background: active ? 'rgba(110,231,183,0.2)' : 'rgba(14,22,48,0.85)',
    border: `2px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
    color: active ? 'var(--accent)' : 'rgba(255,255,255,0.65)',
    fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    pointerEvents: 'auto',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  });

  const sectionTitle = (icon, label) => (
    <div style={{
      color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700,
      marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <EssentialIcon name={icon} size={13} />{label}
    </div>
  );

  const settingRow = (label, control) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 10, minHeight: 28,
    }}>
      <span style={{ color: 'var(--text)', fontSize: '0.84rem' }}>{label}</span>
      {control}
    </div>
  );

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 'calc(26.2% + 8px)', right: 10, zIndex: 10700,
        display: 'flex', gap: 6, alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        <button
          onClick={() => { setOpen(!open); setConfirmReset(false); }}
          style={topBtnStyle(open)}
          title="Settings"
        >
          <EssentialIcon name="Gear" size={20} />
        </button>

        <button
          onClick={quickMusicToggle}
          style={topBtnStyle(false)}
          title={musicOff ? 'Unmute Music' : 'Mute Music'}
        >
          <EssentialIcon name={musicOff ? 'SpeakerMute' : 'MusicNotes'} size={20} />
          {musicOff && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 14, height: 14, borderRadius: '50%',
              background: '#ef4444', border: '2px solid rgba(14,22,48,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', color: '#fff', fontWeight: 700,
            }}>✕</div>
          )}
        </button>
      </div>

      {open && (
        <div ref={panelRef} style={{
          position: 'fixed', bottom: 'calc(26.2% + 52px)', right: 10, zIndex: 10701,
          pointerEvents: 'auto',
          width: 300, maxWidth: 'calc(100vw - 20px)', maxHeight: 'calc(100vh - 26.2% - 70px)', overflowY: 'auto', overflowX: 'hidden',
          backgroundImage: 'url(/images/ui-panel-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
          border: '2px solid rgba(110,231,183,0.25)',
          borderRadius: 14, padding: 0,
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(110,231,183,0.08)',
          animation: 'fadeIn 0.15s ease-out',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(110,231,183,0.08), transparent)',
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 }}>
                <EssentialIcon name="Gear" size={15} style={{ marginRight: 6 }} />Settings
              </span>
              <button onClick={() => { setOpen(false); setConfirmReset(false); }} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: 'var(--muted)', fontSize: '1.1rem', cursor: 'pointer',
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                touchAction: 'manipulation',
              }}>&times;</button>
            </div>
          </div>

          <div style={{ padding: '14px 16px 8px' }}>
            {sectionTitle('SpeakerOn', 'Audio')}
            {settingRow(
              <><EssentialIcon name="MusicNotes" size={13} style={{ marginRight: 4 }} />Music</>,
              <button onClick={handleMusicToggle} style={toggleStyle(!musicOff)}>
                <div style={toggleKnob(!musicOff)} />
              </button>
            )}
            {!musicOff && (
              <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                <input type="range" min="0" max="0.4" step="0.01" value={musicVol} onChange={handleMusicVol} style={sliderStyle} />
              </div>
            )}
            {settingRow(
              <><EssentialIcon name="SpeakerOn" size={13} style={{ marginRight: 4 }} />Sound Effects</>,
              <button onClick={handleSfxToggle} style={toggleStyle(!sfxOff)}>
                <div style={toggleKnob(!sfxOff)} />
              </button>
            )}
            {!sfxOff && (
              <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                <input type="range" min="0" max="0.5" step="0.01" value={sfxVol} onChange={handleSfxVol} style={sliderStyle} />
              </div>
            )}
          </div>

          <div style={{ padding: '0 16px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            {sectionTitle('Gamepad', 'Display')}
            {settingRow(
              'Fullscreen',
              <button onClick={handleFullscreen} style={{
                padding: '5px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                background: isFullscreen ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isFullscreen ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                color: isFullscreen ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer', touchAction: 'manipulation',
              }}>
                {isFullscreen ? 'Exit' : 'Enter'}
              </button>
            )}
            {settingRow(
              'Text Size',
              <div style={{ display: 'flex', gap: 4 }}>
                {['small', 'normal', 'large'].map(sz => (
                  <button key={sz} onClick={() => setTextSize(sz)} style={{
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: sz === 'small' ? '0.65rem' : sz === 'large' ? '0.9rem' : '0.75rem',
                    fontWeight: textSize === sz ? 700 : 400,
                    background: textSize === sz ? 'rgba(110,231,183,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${textSize === sz ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                    color: textSize === sz ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer', textTransform: 'capitalize',
                    touchAction: 'manipulation',
                  }}>{sz}</button>
                ))}
              </div>
            )}
            {settingRow(
              'Reduced Motion',
              <button onClick={() => setReducedMotion(!reducedMotion)} style={toggleStyle(reducedMotion)}>
                <div style={toggleKnob(reducedMotion)} />
              </button>
            )}
            {settingRow(
              'Screen Shake',
              <button onClick={() => setScreenShake(!screenShake)} style={toggleStyle(screenShake)}>
                <div style={toggleKnob(screenShake)} />
              </button>
            )}
            {settingRow(
              'Show FPS',
              <button onClick={() => setShowFps(!showFps)} style={toggleStyle(showFps)}>
                <div style={toggleKnob(showFps)} />
              </button>
            )}
          </div>

          {playerName && (
            <div style={{ padding: '0 16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
              {sectionTitle('Info', 'Game Info')}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 5 }}>
                <span>Warlord</span><span style={{ color: 'var(--text)' }}>{playerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 5 }}>
                <span>Level</span><span style={{ color: 'var(--text)' }}>{level}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <span>Victories</span><span style={{ color: 'var(--text)' }}>{victories}</span>
              </div>
            </div>
          )}

          <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            {sectionTitle('Restart', 'Danger Zone')}
            {!confirmReset ? (
              <button onClick={handleReset} style={{
                width: '100%', padding: '10px 0', borderRadius: 8,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', touchAction: 'manipulation',
              }}>
                <EssentialIcon name="Restart" size={14} style={{ marginRight: 6 }} />Restart Game
              </button>
            ) : (
              <div>
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 8, textAlign: 'center' }}>
                  This will erase all progress. Are you sure?
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmReset(false)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    background: 'rgba(100,100,100,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}>Cancel</button>
                  <button onClick={handleReset} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    background: 'rgba(239,68,68,0.25)', border: '1px solid #ef4444',
                    color: '#ef4444', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}>Yes, Restart</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
