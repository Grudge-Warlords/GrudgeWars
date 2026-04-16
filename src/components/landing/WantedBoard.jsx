import React, { useState, useEffect, useRef, useCallback } from 'react';

const POSTERS = [
  {
    src: '/images/wanted-lord-malachar.png',
    name: 'Lord Malachar',
    title: 'The Deathless Knight',
    faction: 'Legion',
    panStart: { y: 0 },
    panEnd: { y: -15 },
  },
  {
    src: '/images/wanted-racalvin.png',
    name: 'Racalvin',
    title: 'The Pirate King',
    faction: 'Corsairs',
    panStart: { y: 0 },
    panEnd: { y: -12 },
  },
  {
    src: '/images/wanted-durin.png',
    name: 'Durin Tunnelwatcher',
    title: 'The Deep Scout',
    faction: 'Fabled',
    panStart: { y: 0 },
    panEnd: { y: -18 },
  },
  {
    src: '/images/wanted-kael.png',
    name: 'Kael Shadowblade',
    title: 'The Shadow Blade',
    faction: 'Crusade',
    panStart: { y: 0 },
    panEnd: { y: -14 },
  },
  {
    src: '/images/wanted-sylara.png',
    name: 'Sylara Wildheart',
    title: 'The Forest Spirit',
    faction: 'Fabled',
    panStart: { y: 0 },
    panEnd: { y: -16 },
  },
];

const DISPLAY_DURATION = 8000;
const TRANSITION_DURATION = 1500;

function PosterSlide({ poster, isActive, isPrev }) {
  const visible = isActive || isPrev;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${poster.name} — ${poster.title}`}
      aria-hidden={!isActive}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: isActive ? 1 : 0,
        transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
        zIndex: isActive ? 2 : 1,
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: '-20%',
        backgroundImage: visible ? `url(${poster.src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px) brightness(0.2) saturate(1.5)',
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1,
      }}>
        <img
          src={poster.src}
          alt={`Wanted poster for ${poster.name} — ${poster.title}`}
          style={{
            height: '130%',
            width: 'auto',
            maxWidth: 'none',
            objectFit: 'contain',
            transform: isActive
              ? `translateY(${poster.panEnd.y}%)`
              : `translateY(${poster.panStart.y}%)`,
            transition: isActive
              ? `transform ${DISPLAY_DURATION + TRANSITION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
              : 'none',
            filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.8))',
          }}
        />
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(5,10,24,0.4) 0%, transparent 20%, transparent 80%, rgba(5,10,24,0.7) 100%)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(5,10,24,0.6) 0%, transparent 20%, transparent 80%, rgba(5,10,24,0.6) 100%)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isActive ? '0' : '20px'})`,
        opacity: isActive ? 1 : 0,
        transition: `all ${TRANSITION_DURATION}ms ease ${isActive ? '400ms' : '0ms'}`,
        zIndex: 3,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(18px, 3vw, 28px)',
          fontWeight: '700',
          color: '#f1f5f9',
          textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)',
          letterSpacing: '2px',
        }}>
          {poster.name}
        </div>
        <div style={{
          fontSize: 'clamp(11px, 1.5vw, 14px)',
          color: '#fbbf24',
          fontStyle: 'italic',
          marginTop: '4px',
          textShadow: '0 1px 10px rgba(0,0,0,0.8)',
          letterSpacing: '1px',
        }}>
          {poster.title}
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: '8px',
          padding: '3px 12px',
          borderRadius: '12px',
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.3)',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          color: '#fbbf24',
        }}>
          {poster.faction}
        </div>
      </div>
    </div>
  );
}

export default function WantedBoard() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef(null);
  const timerRef = useRef(null);
  const inViewRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        inViewRef.current = e.isIntersecting;
      },
      { threshold: 0.15 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!inViewRef.current) return;
      setCurrent(c => {
        setPrev(c);
        return (c + 1) % POSTERS.length;
      });
    }, DISPLAY_DURATION);
  }, []);

  useEffect(() => {
    if (!inView) {
      clearInterval(timerRef.current);
      return;
    }
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [inView, startTimer]);

  const goTo = useCallback((idx) => {
    setCurrent(c => {
      if (idx === c) return c;
      setPrev(c);
      startTimer();
      return idx;
    });
  }, [startTimer]);

  return (
    <section
      ref={sectionRef}
      aria-label="Bounty Board"
      style={{
        position: 'relative',
        padding: isMobile ? '40px 16px' : '60px 40px',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(5,10,24,0.95) 0%, rgba(5,10,24,0.7) 50%, rgba(5,10,24,0.95) 100%)',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            color: '#fbbf24',
            marginBottom: '8px',
          }}>
            Bounty Board
          </div>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(24px, 4vw, 38px)',
            fontWeight: '700',
            color: '#e2e8f0',
            margin: 0,
          }}>
            Wanted: Dead or Alive
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            marginTop: '8px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Legendary warlords with bounties on their heads. Hunt them down for glory and gold.
          </p>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Wanted poster showcase"
          aria-live="polite"
          style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? '480px' : '640px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(251,191,36,0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(251,191,36,0.03)',
            background: '#0a0a0f',
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1s ease 0.2s',
          }}
        >
          {POSTERS.map((poster, i) => (
            <PosterSlide
              key={poster.name}
              poster={poster}
              isActive={i === current}
              isPrev={i === prev}
            />
          ))}

          <div style={{
            position: 'absolute',
            bottom: isMobile ? '12px' : '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            zIndex: 10,
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }} role="tablist" aria-label="Select wanted poster">
            {POSTERS.map((p, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                role="tab"
                aria-label={`View ${p.name}`}
                aria-selected={i === current}
                style={{
                  width: i === current ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: i === current ? '#fbbf24' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.4s ease',
                  boxShadow: i === current ? '0 0 8px rgba(251,191,36,0.6)' : 'none',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.outline = '2px solid #fbbf24'; e.target.style.outlineOffset = '2px'; }}
                onBlur={e => { e.target.style.outline = 'none'; }}
              />
            ))}
          </div>

          <div style={{
            position: 'absolute',
            top: isMobile ? '12px' : '16px',
            right: isMobile ? '12px' : '16px',
            zIndex: 10,
            padding: '4px 12px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(251,191,36,0.2)',
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#fbbf24',
          }}>
            {current + 1} / {POSTERS.length}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          justifyContent: 'center',
          marginTop: '24px',
          flexWrap: 'wrap',
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.8s ease 0.4s',
        }}>
          {POSTERS.map((poster, i) => (
            <button
              key={poster.name}
              onClick={() => goTo(i)}
              aria-label={`View ${poster.name} — ${poster.faction}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '6px 10px' : '8px 16px',
                borderRadius: '10px',
                border: `1px solid ${i === current ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)'}`,
                background: i === current ? 'rgba(251,191,36,0.1)' : 'rgba(15,15,25,0.6)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.outline = '2px solid #fbbf24'; e.currentTarget.style.outlineOffset = '2px'; }}
              onBlur={e => { e.currentTarget.style.outline = 'none'; }}
            >
              <img
                src={poster.src}
                alt=""
                aria-hidden="true"
                style={{
                  width: isMobile ? '28px' : '36px',
                  height: isMobile ? '36px' : '48px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: `1px solid ${i === current ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  filter: i === current ? 'brightness(1)' : 'brightness(0.5) grayscale(0.5)',
                  transition: 'filter 0.3s ease',
                }}
              />
              {!isMobile && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: i === current ? '#f1f5f9' : '#64748b',
                    fontFamily: "'Cinzel', serif",
                    transition: 'color 0.3s',
                    whiteSpace: 'nowrap',
                  }}>
                    {poster.name}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: i === current ? '#fbbf24' : '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'color 0.3s',
                  }}>
                    {poster.faction}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
