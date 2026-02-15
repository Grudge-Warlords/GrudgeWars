import { useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';

const SCREEN_TO_SLUG = {
  title: '/',
  intro: '/intro',
  lobby: '/war-room',
  create: '/create-character',
  world: '/world-map',
  location: '/location',
  battle: '/battle',
  character: '/character-sheet',
  skills: '/skill-tree',
  heroCreate: '/recruit-hero',
  account: '/account',
  training: '/training',
  scene: '/scene',
};

const SLUG_TO_SCREEN = {};
Object.entries(SCREEN_TO_SLUG).forEach(([screen, slug]) => {
  SLUG_TO_SCREEN[slug] = screen;
});

export function getScreenFromPath(path) {
  return SLUG_TO_SCREEN[path] || null;
}

export function getSlugFromScreen(screen) {
  return SCREEN_TO_SLUG[screen] || '/';
}

export default function useRouteSync() {
  const screen = useGameStore(s => s.screen);
  const setScreen = useGameStore(s => s.setScreen);
  const isPopstate = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const path = window.location.pathname;
      const screenFromUrl = getScreenFromPath(path);
      if (screenFromUrl && screenFromUrl !== 'title' && screenFromUrl !== screen) {
        setScreen(screenFromUrl);
      } else if (!screenFromUrl && path !== '/') {
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (isPopstate.current) {
      isPopstate.current = false;
      return;
    }
    const slug = getSlugFromScreen(screen);
    if (window.location.pathname !== slug) {
      window.history.pushState({ screen }, '', slug);
    }
  }, [screen]);

  useEffect(() => {
    const handlePopState = (e) => {
      const targetScreen = e.state?.screen || getScreenFromPath(window.location.pathname) || 'title';
      isPopstate.current = true;
      setScreen(targetScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setScreen]);
}
