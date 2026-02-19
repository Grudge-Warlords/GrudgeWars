import React, { useState, useEffect, useRef } from 'react';
import useGameStore from './stores/gameStore';
import { startPreload, isReady } from './utils/assetManager';
import VideoBackground from './components/VideoBackground';
import LoadingScreen from './components/LoadingScreen';
import TitleScreen from './components/TitleScreen';
import CharacterCreate from './components/CharacterCreate';
import WorldMap from './components/WorldMap';
import LocationView from './components/LocationView';
import BattleScreen from './components/BattleScreen';
import CharacterSheet from './components/CharacterSheet';
import SkillTreeView from './components/SkillTreeView';
import HeroCreate from './components/HeroCreate';
import AccountPage from './components/AccountPage';
import LobbyScreen from './components/LobbyScreen';
import TrainingScreen from './components/TrainingScreen';
import LootPopup from './components/LootPopup';
import SettingsMenu from './components/SettingsMenu';
import AdminMap from './components/AdminMap';
import AdminBattle from './components/AdminBattle';
import AdminSprite from './components/AdminSprite';
import SceneView from './components/SceneView';
import IntroCinematic from './components/IntroCinematic';
import DiscordAuth from './components/DiscordAuth';
import ArenaPage from './components/ArenaPage';
import CraftingPage from './components/CraftingPage';
import BackgroundsPage from './components/BackgroundsPage';
import { InlineIcon } from './data/uiSprites';
import GameTooltipRenderer from './components/GameTooltip';
import ErrorBoundary from './components/ErrorBoundary';
import useRouteSync from './hooks/useRouteSync';
import { FactoryWizard } from './factory/components/FactoryWizard';
import LandingPage from './components/LandingPage';
import GBuxPage from './factory/components/GBuxPage';

function IntroVideoScreen({ onFinish }) {
  const videoRef = useRef(null);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);
  const [assetsReady, setAssetsReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 1 });

  const safeTimeout = (fn, ms) => {
    const id = setTimeout(() => { if (mountedRef.current) fn(); }, ms);
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => {
    mountedRef.current = true;
    const loadAssets = isReady()
      ? (() => { setProgress({ loaded: 1, total: 1 }); return Promise.resolve(); })()
      : startPreload((loaded, total) => {
          if (mountedRef.current) setProgress({ loaded, total });
        });

    loadAssets.then(() => {
      if (!mountedRef.current) return;
      setAssetsReady(true);
      safeTimeout(() => setSkipVisible(true), 300);
    });

    const vid = videoRef.current;
    if (vid) {
      const playPromise = vid.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          if (mountedRef.current) setNeedsTap(true);
        });
      }
    }

    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (videoEnded && assetsReady && mountedRef.current) {
      doFinish();
    }
  }, [videoEnded, assetsReady]);

  const doFinish = () => {
    if (fadingOut || !mountedRef.current) return;
    setFadingOut(true);
    safeTimeout(() => onFinish(), 600);
  };

  const handleTapToPlay = () => {
    setNeedsTap(false);
    const vid = videoRef.current;
    if (vid) vid.play().catch(() => {});
  };

  const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#000',
      opacity: fadingOut ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      <video
        ref={videoRef}
        src="/videos/intro_cinematic.mp4"
        muted
        playsInline
        onEnded={() => { if (mountedRef.current) setVideoEnded(true); }}
        onError={() => { if (mountedRef.current) setVideoEnded(true); }}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}
      />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />

      {needsTap && (
        <div
          onClick={handleTapToPlay}
          style={{
            position: 'absolute', inset: 0, zIndex: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            background: 'rgba(0,0,0,0.6)', borderRadius: '50%',
            width: 80, height: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(34,211,238,0.5)',
            animation: 'fadeIn 0.5s ease',
          }}>
            <span style={{ color: '#22d3ee', fontSize: 32, marginLeft: 4 }}>▶</span>
          </div>
        </div>
      )}

      {!assetsReady && (
        <div style={{
          position: 'absolute', bottom: 'max(60px, env(safe-area-inset-bottom, 20px))',
          left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', zIndex: 2,
        }}>
          <div style={{
            width: 200, height: 4, background: 'rgba(255,255,255,0.15)',
            borderRadius: 2, overflow: 'hidden', margin: '0 auto 8px',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
              borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
            letterSpacing: 2, fontFamily: "'Jost', sans-serif",
          }}>
            Loading {pct}%
          </div>
        </div>
      )}

      {assetsReady && skipVisible && (
        <button
          onClick={doFinish}
          style={{
            position: 'absolute',
            bottom: 'max(30px, env(safe-area-inset-bottom, 20px))',
            right: 'clamp(16px, 5vw, 40px)',
            zIndex: 3,
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(34,211,238,0.5)',
            borderRadius: 8,
            padding: '12px 28px',
            color: '#22d3ee',
            fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            letterSpacing: 3,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.5s ease',
            minHeight: 44,
            minWidth: 44,
          }}
        >
          SKIP ▸
        </button>
      )}
    </div>
  );
}

function GameApp() {
  const screen = useGameStore(s => s.screen);
  const gameMessage = useGameStore(s => s.gameMessage);
  const clearMessage = useGameStore(s => s.clearMessage);
  const pendingLoot = useGameStore(s => s.pendingLoot);

  useRouteSync();

  const [introVideoDone, setIntroVideoDone] = useState(false);
  const prevScreenRef = useRef(screen);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState('none');

  useEffect(() => {
    const prev = prevScreenRef.current;
    if (screen !== prev) {
      const needsTransition = (
        (prev === 'title' && screen === 'intro') ||
        (prev === 'intro' && screen === 'lobby') ||
        (prev === 'title' && screen === 'lobby') ||
        (prev === 'lobby' && screen === 'create') ||
        (prev === 'title' && screen === 'create') ||
        (prev === 'create' && screen === 'world') ||
        (prev === 'lobby' && screen === 'world') ||
        (screen === 'battle') ||
        (prev === 'battle' && (screen === 'world' || screen === 'location'))
      );
      if (needsTransition) {
        setTransitioning(true);
        setTransitionPhase('in');
        const t1 = setTimeout(() => setTransitionPhase('hold'), 400);
        const t2 = setTimeout(() => setTransitionPhase('out'), 800);
        const t3 = setTimeout(() => {
          setTransitioning(false);
          setTransitionPhase('none');
        }, 1200);
        prevScreenRef.current = screen;
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
      }
      prevScreenRef.current = screen;
    }
  }, [screen]);

  if (!introVideoDone) {
    return <IntroVideoScreen onFinish={() => setIntroVideoDone(true)} />;
  }

  const screensWithOwnBackground = ['world', 'battle', 'location', 'scene', 'intro'];
  const bgVisible = !screensWithOwnBackground.includes(screen);
  const bgBlurred = screen !== 'title' && screen !== 'lobby' && screen !== 'intro';

  const renderScreen = () => {
    switch (screen) {
      case 'title': return <TitleScreen />;
      case 'intro': return <ErrorBoundary name="intro"><IntroCinematic /></ErrorBoundary>;
      case 'lobby': return <ErrorBoundary name="lobby"><LobbyScreen /></ErrorBoundary>;
      case 'create': return <ErrorBoundary name="create"><CharacterCreate /></ErrorBoundary>;
      case 'world': return <ErrorBoundary name="world"><WorldMap /></ErrorBoundary>;
      case 'location': return <ErrorBoundary name="location"><LocationView /></ErrorBoundary>;
      case 'battle': return <ErrorBoundary name="battle"><BattleScreen /></ErrorBoundary>;
      case 'character': return <ErrorBoundary name="character"><CharacterSheet /></ErrorBoundary>;
      case 'skills': return <ErrorBoundary name="skills"><SkillTreeView /></ErrorBoundary>;
      case 'heroCreate': return <ErrorBoundary name="heroCreate"><HeroCreate /></ErrorBoundary>;
      case 'account': return <ErrorBoundary name="account"><AccountPage /></ErrorBoundary>;
      case 'training': return <ErrorBoundary name="training"><TrainingScreen /></ErrorBoundary>;
      case 'scene': return <ErrorBoundary name="scene"><SceneView /></ErrorBoundary>;
      default: return <TitleScreen />;
    }
  };

  return (
    <div className="game-frame">
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <VideoBackground blurred={bgBlurred} visible={bgVisible} />
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%',
          animation: 'fadeIn 0.5s ease'
        }}>
          {renderScreen()}
        </div>
        {transitionPhase !== 'none' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10500,
            backgroundImage: 'url(/images/loading.gif)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: transitionPhase === 'in' ? 1 : transitionPhase === 'hold' ? 1 : 0,
            transition: transitionPhase === 'in' ? 'opacity 0.4s ease-in' : 'opacity 0.4s ease-out',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(2,10,24,0.3)',
            }} />
          </div>
        )}
      </div>
      <div id="hud-overlay" style={{ position: 'absolute', inset: 0, zIndex: 10600, pointerEvents: 'none' }}>
        <GameTooltipRenderer />
        <SettingsMenu />
        {pendingLoot && pendingLoot.length > 0 && <LootPopup />}
        {gameMessage && !(pendingLoot && pendingLoot.length > 0) && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10700, pointerEvents: 'auto', animation: 'fadeIn 0.3s ease'
          }} onClick={clearMessage}>
            <div style={{
              background: 'linear-gradient(135deg, #141a2b, #1e293b)',
              border: '2px solid var(--gold)', borderRadius: 16, padding: '30px 50px',
              textAlign: 'center', maxWidth: 400, animation: 'slideUp 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}><InlineIcon name="sparkle" size={24} /></div>
              <div className="font-cinzel" style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: 10 }}>
                {gameMessage}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Click to continue</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === '/adminmap') return <AdminMap />;
  if (path === '/adminbattle') return <AdminBattle />;
  if (path === '/adminsprite') return <AdminSprite />;
  if (path === '/discordauth') return <DiscordAuth />;
  if (path === '/arena') return <ArenaPage />;
  if (path === '/crafting') return <CraftingPage />;
  if (path === '/backgrounds') return <BackgroundsPage />;
  if (path === '/factory') return <FactoryWizard />;
  if (path === '/gbux') return <GBuxPage />;
  if (path === '/play') return <GameApp />;

  return <LandingPage />;
}
