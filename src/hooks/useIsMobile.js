import { useState, useEffect } from 'react';

const BREAKPOINTS = { mobile: 640, tablet: 768, small: 480 };

export default function useIsMobile(breakpoint = BREAKPOINTS.mobile) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

export function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    let raf;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVp({ w: window.innerWidth, h: window.innerHeight }));
    };
    window.addEventListener('resize', handler);
    handler();
    return () => { window.removeEventListener('resize', handler); cancelAnimationFrame(raf); };
  }, []);

  const isMobile = vp.w <= BREAKPOINTS.mobile;
  const isTablet = vp.w > BREAKPOINTS.mobile && vp.w <= BREAKPOINTS.tablet;
  const isSmall = vp.w <= BREAKPOINTS.small;
  const isLandscape = vp.w > vp.h;

  return { ...vp, isMobile, isTablet, isSmall, isLandscape };
}
