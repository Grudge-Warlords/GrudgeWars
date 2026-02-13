import React, { useState, useEffect, useRef, useCallback } from 'react';

function FishPortrait({ spriteData, size = 44 }) {
  const idleAnim = spriteData?.idle;
  if (!idleAnim) return null;

  const frameWidth = spriteData?.frameWidth || 48;
  const frameHeight = spriteData?.frameHeight || 48;
  const scale = (size / Math.min(frameWidth, frameHeight)) * 2.4;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${idleAnim.src})`,
        backgroundSize: `${frameWidth * (idleAnim.frames || 1) * scale}px ${frameHeight * scale}px`,
        backgroundPosition: `0px 0px`,
        imageRendering: 'pixelated',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        filter: spriteData?.filter || 'none',
      }} />
    </div>
  );
}

function BubbleTail({ color }) {
  return (
    <svg
      width="20"
      height="32"
      viewBox="0 0 20 32"
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: -1,
        display: 'block',
        overflow: 'visible',
      }}
    >
      <circle cx="10" cy="6" r="4" fill={color || '#0d1b2e'} fillOpacity="0.85" stroke="rgba(100,220,255,0.3)" strokeWidth="1" />
      <circle cx="10" cy="16" r="2.8" fill={color || '#0d1b2e'} fillOpacity="0.7" stroke="rgba(100,220,255,0.2)" strokeWidth="0.8" />
      <circle cx="10" cy="24" r="1.8" fill={color || '#0d1b2e'} fillOpacity="0.5" stroke="rgba(100,220,255,0.15)" strokeWidth="0.6" />
    </svg>
  );
}

function FloatingBubble({ bubble, index, totalVisible, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const posRef = useRef({ y: 0, x: 0 });
  const floatRef = useRef(null);
  const startTime = useRef(Date.now());
  const elemRef = useRef(null);
  const seedRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const seed = seedRef.current;
    const tick = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const speed = 12 + Math.sin(seed) * 4;
      const yRaw = -elapsed * speed;
      const maxRise = -180;
      const y = Math.max(maxRise, yRaw * (1 - Math.min(1, Math.abs(yRaw) / (Math.abs(maxRise) * 1.5))));
      const wobbleX = Math.sin(elapsed * 1.2 + seed) * 12 + Math.sin(elapsed * 2.5 + seed * 2) * 5;

      posRef.current = { y, x: wobbleX };
      if (elemRef.current) {
        elemRef.current.style.transform = `translate(${wobbleX}px, ${y}px)`;
      }
      floatRef.current = requestAnimationFrame(tick);
    };
    floatRef.current = requestAnimationFrame(tick);
    return () => { if (floatRef.current) cancelAnimationFrame(floatRef.current); };
  }, []);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => { if (onDismiss) onDismiss(bubble.id); }, 300);
  }, [bubble.id, onDismiss]);

  useEffect(() => {
    if (bubble.autoExpire) {
      const t = setTimeout(handleDismiss, bubble.autoExpire);
      return () => clearTimeout(t);
    }
  }, [bubble.autoExpire, handleDismiss]);

  const opacity = exiting ? 0 : (visible ? 1 : 0);
  const accent = bubble.colorHex || '#40c9ff';

  return (
    <div
      ref={elemRef}
      style={{
        transition: exiting ? 'opacity 0.3s ease' : 'opacity 0.5s ease',
        opacity,
        pointerEvents: opacity > 0.3 ? 'auto' : 'none',
        cursor: 'pointer',
        marginBottom: 8,
        maxWidth: 480,
        minWidth: 180,
        width: 'max-content',
        willChange: 'transform',
      }}
      onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
    >
      <div style={{
        position: 'relative',
        filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 12px ${accent}22)`,
      }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(10,20,45,0.92) 0%, rgba(15,30,60,0.88) 50%, rgba(10,20,45,0.92) 100%)`,
          backdropFilter: 'blur(8px)',
          border: `1.5px solid ${accent}55`,
          borderRadius: 18,
          padding: '10px 18px 12px 18px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse at 30% 20%, ${accent}12 0%, transparent 60%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `2px solid ${accent}88`,
                overflow: 'hidden', flexShrink: 0,
                background: `radial-gradient(ellipse at center, #1a2a4a 0%, #0a1020 100%)`,
                boxShadow: `0 0 8px ${accent}33, inset 0 0 6px rgba(0,0,0,0.6)`,
              }}>
                {bubble.spriteData && <FishPortrait spriteData={bubble.spriteData} size={36} />}
              </div>

              <div style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: '0.72rem',
                color: accent,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: `0 0 8px ${accent}44`,
                lineHeight: 1.2,
              }}>
                {bubble.speaker?.name}
              </div>
            </div>

            <div style={{
              width: '80%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
              margin: '0 auto',
            }} />

            <div style={{
              fontSize: '0.88rem',
              color: '#d4e8f0',
              lineHeight: 1.55,
              fontWeight: 400,
              fontFamily: "'Jost', sans-serif",
              wordBreak: 'break-word',
              textAlign: 'center',
              letterSpacing: '0.01em',
              padding: '0 4px',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>
              {bubble.text?.replace(`${bubble.speaker?.name}: `, '')}
            </div>
          </div>
        </div>

        <BubbleTail color={`rgba(10,20,45,0.85)`} />
      </div>
    </div>
  );
}

export default function ChatBubbleSystem({ bubbleQueue, onDismiss, camZoom = 3, heroSpriteOffset }) {
  if (!bubbleQueue || bubbleQueue.length === 0) return null;

  const bubbleScale = Math.max(0.6, 1.4 / camZoom);
  const offsetX = heroSpriteOffset?.x || 0;
  const offsetY = heroSpriteOffset?.y || 0;

  return (
    <div style={{
      position: 'absolute',
      left: `calc(50% + ${offsetX}px)`,
      bottom: `calc(100% - ${offsetY}px)`,
      transform: `translateX(-50%) scale(${bubbleScale})`,
      transformOrigin: 'bottom center',
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 9500,
      paddingBottom: 30,
      minWidth: 180,
    }}>
      {bubbleQueue.map((bubble, i) => (
        <FloatingBubble
          key={bubble.id}
          bubble={bubble}
          index={i}
          totalVisible={bubbleQueue.length}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
