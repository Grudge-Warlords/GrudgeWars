import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/useAuth';
import NavBar from './components/NavBar';
import LoadingScreen from './components/LoadingScreen';
import LegionPanel from './components/debug/LegionPanel';

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Play = lazy(() => import('./pages/Play'));
const GrudgeBox = lazy(() => import('./pages/GrudgeBox'));
const ShadowOps = lazy(() => import('./pages/ShadowOps'));
const DungeonCrawler = lazy(() => import('./pages/DungeonCrawler'));
const GrudgeFootsies = lazy(() => import('./pages/GrudgeFootsies'));
const PlatformRunner = lazy(() => import('./pages/PlatformRunner'));
const GrudgeDrive = lazy(() => import('./pages/GrudgeDrive'));
const Arena = lazy(() => import('./pages/Arena'));
const Account = lazy(() => import('./pages/Account'));
const Admin = lazy(() => import('./pages/Admin'));
const DiscordAuth = lazy(() => import('./pages/DiscordAuth'));
const Games = lazy(() => import('./pages/Games'));

// Pages that hide the nav (full-screen games)
const FULLSCREEN_ROUTES = ['/play', '/grudge-box', '/shadow-ops', '/dungeon-crawler',
  '/grudge-footsies', '/platform-runner', '/grudge-drive', '/arena'];

function AppLayout() {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some(r => location.pathname.startsWith(r));
  const { tryRestoreSession } = useAuthStore();

  useEffect(() => { tryRestoreSession(); }, []);

  return (
    <>
      {!isFullscreen && <NavBar />}
      <LegionPanel />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/games" element={<Games />} />
          <Route path="/play" element={<Play />} />
          <Route path="/grudge-box" element={<GrudgeBox />} />
          <Route path="/shadow-ops" element={<ShadowOps />} />
          <Route path="/dungeon-crawler" element={<DungeonCrawler />} />
          <Route path="/grudge-footsies" element={<GrudgeFootsies />} />
          <Route path="/platform-runner" element={<PlatformRunner />} />
          <Route path="/grudge-drive" element={<GrudgeDrive />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/discordauth" element={<DiscordAuth />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || ''}>
      <AppLayout />
    </BrowserRouter>
  );
}
