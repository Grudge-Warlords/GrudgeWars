import React, { useState, useEffect, useRef } from 'react';

const NAV_CATEGORIES = [
  { label: 'Home', path: '/', icon: '🏠' },
  {
    label: 'Fighting',
    icon: '🥊',
    items: [
      { label: 'G.K.O. Boxing', path: '/gko-boxing', icon: '🥊', desc: '1v1 cyberpunk boxing' },
      { label: 'Grudge Footsies', path: '/grudge-footsies', icon: '👊', desc: 'Avatar fighting game' },
      { label: 'Shadow Knights', path: '/demo/shadow-knights', icon: '🛡️', desc: 'Knight combat demo' },
    ],
  },
  {
    label: 'Action',
    icon: '⚔️',
    items: [
      { label: "Warlord's Gauntlet", path: '/warlords-gauntlet', icon: '⚔️', desc: 'Side-scrolling platformer' },
      { label: 'Shadow Ops', path: '/shadow-ops', icon: '🎯', desc: 'Top-down survival shooter' },
    ],
  },
  {
    label: 'RPG',
    icon: '🐟',
    items: [
      { label: 'Betta Warlords', path: '/play', icon: '🐟', desc: 'Fish warlord RPG' },
      { label: 'Crypt Crawlers', path: '/dungeon-crawler', icon: '🗡️', desc: 'Dungeon crawler roguelike' },
      { label: 'Starbound Corsairs', path: '/demo/starbound-corsairs', icon: '🚀', desc: 'Space pirate combat' },
    ],
  },
  {
    label: 'Community',
    icon: '👥',
    items: [
      { label: 'Social', path: '/social', icon: '👥', desc: 'Community hub' },
      { label: 'Avatar', path: '/avatar', icon: '🎨', desc: 'Character creator' },
      { label: 'Game Factory', path: '/factory', icon: '🏭', desc: 'Sprite & asset tools' },
    ],
  },
];

const ALL_ITEMS = NAV_CATEGORIES.flatMap(cat => cat.items ? cat.items : [cat]);

export default function GameHeader({ currentPath }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
      if (menuOpen) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const ROUTE_ALIASES = {
    '/gko-boxing': ['/grudge-box'],
  };

  const isActive = (path) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    const aliases = ROUTE_ALIASES[path];
    if (aliases && aliases.some(a => currentPath.startsWith(a))) return true;
    return false;
  };

  const isCategoryActive = (cat) => {
    if (cat.path) return isActive(cat.path);
    return cat.items?.some(item => isActive(item.path));
  };

  const handleMouseEnter = (label) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const navigate = (path) => {
    setOpenDropdown(null);
    setMenuOpen(false);
    if (!isActive(path)) window.location.href = path;
  };

  return (
    <>
      <style>{`
        @keyframes headerSlideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes gbuxPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(251,191,36,0.2); }
          50% { box-shadow: 0 0 16px rgba(251,191,36,0.4); }
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gs-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50000;
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          font-family: 'Jost', sans-serif;
          animation: headerSlideIn 0.3s ease-out;
          transition: background 0.3s, box-shadow 0.3s;
        }
        .gs-header-bg {
          background: rgba(5, 10, 24, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(251,191,36,0.1);
        }
        .gs-header-scrolled {
          background: rgba(5, 10, 24, 0.96);
          box-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
          border-bottom: 1px solid rgba(251,191,36,0.2);
        }
        .gs-header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
        }
        .gs-header-brand img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: drop-shadow(0 0 6px rgba(251,191,36,0.3));
          transition: filter 0.3s;
        }
        .gs-header-brand:hover img {
          filter: drop-shadow(0 0 10px rgba(251,191,36,0.5));
        }
        .gs-header-brand-text {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          font-weight: 700;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 1.5px;
        }
        .gs-header-nav {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .gs-header-cat {
          position: relative;
        }
        .gs-header-cat-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          background: none;
          font-family: 'Jost', sans-serif;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .gs-header-cat-btn:hover {
          color: #fbbf24;
          background: rgba(251,191,36,0.06);
        }
        .gs-header-cat-btn-active {
          color: #fbbf24;
          background: rgba(251,191,36,0.1);
        }
        .gs-header-cat-arrow {
          font-size: 8px;
          transition: transform 0.2s;
          margin-top: 1px;
        }
        .gs-header-cat-arrow-open {
          transform: rotate(180deg);
        }
        .gs-header-dropdown-panel {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 6px;
          min-width: 220px;
          background: rgba(10, 15, 30, 0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(251,191,36,0.15);
          border-radius: 10px;
          padding: 6px;
          z-index: 50001;
          animation: dropdownFadeIn 0.15s ease-out;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset;
        }
        .gs-header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 7px;
          font-size: 13px;
          color: #c8d0dc;
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'Jost', sans-serif;
        }
        .gs-header-dropdown-item:hover {
          color: #fbbf24;
          background: rgba(251,191,36,0.08);
        }
        .gs-header-dropdown-item-active {
          color: #fbbf24;
          background: rgba(251,191,36,0.1);
        }
        .gs-header-dropdown-icon {
          font-size: 16px;
          width: 22px;
          text-align: center;
          flex-shrink: 0;
        }
        .gs-header-dropdown-info {
          display: flex;
          flex-direction: column;
        }
        .gs-header-dropdown-label {
          font-weight: 500;
          line-height: 1.2;
        }
        .gs-header-dropdown-desc {
          font-size: 10px;
          color: #64748b;
          line-height: 1.3;
          margin-top: 1px;
        }
        .gs-header-gbux {
          padding: 5px 14px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #0a0a0f;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          letter-spacing: 0.5px;
          transition: all 0.3s;
          animation: gbuxPulse 3s ease-in-out infinite;
          margin-left: 6px;
        }
        .gs-header-gbux:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(251,191,36,0.4);
        }
        .gs-header-hamburger {
          display: none;
          margin-left: auto;
          padding: 6px;
          border: none;
          background: none;
          cursor: pointer;
          color: #94a3b8;
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
        }
        .gs-header-hamburger:hover {
          color: #fbbf24;
        }

        .gs-mobile-menu {
          position: fixed;
          top: 48px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 10, 24, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 49999;
          overflow-y: auto;
          padding: 8px;
          animation: headerSlideIn 0.2s ease-out;
        }
        .gs-mobile-cat {
          margin-bottom: 4px;
        }
        .gs-mobile-cat-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'Jost', sans-serif;
          transition: all 0.2s;
        }
        .gs-mobile-cat-header:hover {
          color: #fbbf24;
          background: rgba(251,191,36,0.04);
        }
        .gs-mobile-cat-header-active {
          color: #fbbf24;
        }
        .gs-mobile-cat-arrow {
          margin-left: auto;
          font-size: 10px;
          transition: transform 0.2s;
          color: #475569;
        }
        .gs-mobile-cat-arrow-open {
          transform: rotate(180deg);
          color: #fbbf24;
        }
        .gs-mobile-cat-items {
          padding-left: 20px;
          overflow: hidden;
        }
        .gs-mobile-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          color: #94a3b8;
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'Jost', sans-serif;
          transition: all 0.2s;
        }
        .gs-mobile-item:hover {
          color: #fbbf24;
          background: rgba(251,191,36,0.06);
        }
        .gs-mobile-item-active {
          color: #fbbf24;
          background: rgba(251,191,36,0.1);
        }
        .gs-mobile-item-icon {
          font-size: 16px;
          width: 24px;
          text-align: center;
        }
        .gs-mobile-gbux {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 12px 14px 4px;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #0a0a0f;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          text-decoration: none;
          cursor: pointer;
          border: none;
          font-family: 'Jost', sans-serif;
        }
        @media (max-width: 900px) {
          .gs-header-nav { display: none; }
          .gs-header-hamburger { display: block; }
        }
        .gs-header-spacer {
          height: 48px;
          flex-shrink: 0;
        }
      `}</style>

      <header className={`gs-header ${scrolled ? 'gs-header-scrolled' : 'gs-header-bg'}`}>
        <a href="/" className="gs-header-brand" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <img src="/grudge-logo.png" alt="" />
          <span className="gs-header-brand-text">GRUDGE STUDIOS</span>
        </a>

        <nav className="gs-header-nav" ref={dropdownRef}>
          {NAV_CATEGORIES.map(cat => {
            if (cat.path) {
              return (
                <a
                  key={cat.label}
                  href={cat.path}
                  className={`gs-header-cat-btn ${isActive(cat.path) ? 'gs-header-cat-btn-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate(cat.path); }}
                >
                  {cat.label}
                </a>
              );
            }
            const isOpen = openDropdown === cat.label;
            return (
              <div
                key={cat.label}
                className="gs-header-cat"
                onMouseEnter={() => handleMouseEnter(cat.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`gs-header-cat-btn ${isCategoryActive(cat) ? 'gs-header-cat-btn-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(isOpen ? null : cat.label);
                  }}
                >
                  {cat.label}
                  <span className={`gs-header-cat-arrow ${isOpen ? 'gs-header-cat-arrow-open' : ''}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="gs-header-dropdown-panel">
                    {cat.items.map(item => (
                      <a
                        key={item.path}
                        href={item.path}
                        className={`gs-header-dropdown-item ${isActive(item.path) ? 'gs-header-dropdown-item-active' : ''}`}
                        onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                      >
                        <span className="gs-header-dropdown-icon">{item.icon}</span>
                        <span className="gs-header-dropdown-info">
                          <span className="gs-header-dropdown-label">{item.label}</span>
                          {item.desc && <span className="gs-header-dropdown-desc">{item.desc}</span>}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <a
            href="/gbux"
            className="gs-header-gbux"
            onClick={(e) => { e.preventDefault(); navigate('/gbux'); }}
          >
            GBuX Store
          </a>
        </nav>

        <button
          className="gs-header-hamburger"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(prev => !prev);
          }}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {menuOpen && (
        <div className="gs-mobile-menu" onClick={(e) => e.stopPropagation()}>
          {NAV_CATEGORIES.map(cat => {
            if (cat.path) {
              return (
                <a
                  key={cat.label}
                  href={cat.path}
                  className={`gs-mobile-item ${isActive(cat.path) ? 'gs-mobile-item-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate(cat.path); }}
                >
                  <span className="gs-mobile-item-icon">{cat.icon}</span>
                  {cat.label}
                </a>
              );
            }
            const isExpanded = mobileExpanded === cat.label;
            return (
              <div key={cat.label} className="gs-mobile-cat">
                <button
                  className={`gs-mobile-cat-header ${isCategoryActive(cat) ? 'gs-mobile-cat-header-active' : ''}`}
                  onClick={() => setMobileExpanded(isExpanded ? null : cat.label)}
                >
                  <span style={{ fontSize: '16px', width: 24, textAlign: 'center' }}>{cat.icon}</span>
                  {cat.label}
                  <span className={`gs-mobile-cat-arrow ${isExpanded ? 'gs-mobile-cat-arrow-open' : ''}`}>▼</span>
                </button>
                {isExpanded && (
                  <div className="gs-mobile-cat-items">
                    {cat.items.map(item => (
                      <a
                        key={item.path}
                        href={item.path}
                        className={`gs-mobile-item ${isActive(item.path) ? 'gs-mobile-item-active' : ''}`}
                        onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                      >
                        <span className="gs-mobile-item-icon">{item.icon}</span>
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <button
            className="gs-mobile-gbux"
            onClick={() => navigate('/gbux')}
          >
            GBuX Token Store
          </button>
        </div>
      )}

      <div className="gs-header-spacer" />
    </>
  );
}
