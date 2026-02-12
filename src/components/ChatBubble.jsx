import React, { useState, useEffect, useRef, useCallback } from 'react';

function FishPortrait({ spriteData, size = 68 }) {
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
        top: '35%',
        transform: 'translate(-50%, -50%)',
        filter: spriteData?.filter || 'none',
      }} />
    </div>
  );
}

function BubbleTail({ colorHex }) {
  return (
    <svg
      width="24"
      height="40"
      viewBox="0 0 24 40"
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: -2,
        display: 'block',
        overflow: 'visible',
      }}
    >
      <circle cx="12" cy="8" r="4" fill="#fffef5" stroke="#111" strokeWidth="2" />
      <circle cx="12" cy="20" r="3" fill="#fffef5" stroke="#111" strokeWidth="1.8" />
      <circle cx="12" cy="30" r="2" fill="#fffef5" stroke="#111" strokeWidth="1.5" />
      <circle cx="12" cy="37" r="1.2" fill="#fffef5" stroke="#111" strokeWidth="1.2" />
    </svg>
  );
}

function FloatingBubble({ bubble, index, totalVisible, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [floatY, setFloatY] = useState(0);
  const floatRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      setFloatY(-elapsed * 8);
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

  const opacity = exiting ? 0 : (visible ? (Math.max(0, 1 - Math.abs(floatY) / 200)) : 0);

  return (
    <div
      style={{
        transition: exiting ? 'opacity 0.3s ease' : 'opacity 0.4s ease',
        opacity,
        transform: `translateY(${floatY}px)`,
        pointerEvents: opacity > 0.3 ? 'auto' : 'none',
        cursor: 'pointer',
        marginBottom: 10,
        maxWidth: 380,
        minWidth: 240,
        width: 'auto',
      }}
      onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
    >
      <div style={{
        position: 'relative',
        filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.5))',
      }}>
        <div style={{
          background: '#fffef5',
          border: '3px solid #111',
          borderRadius: 24,
          padding: '12px 16px 12px 12px',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              border: `3px solid ${bubble.colorHex}`,
              overflow: 'hidden', flexShrink: 0,
              background: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0a1428 100%)',
              boxShadow: `inset 0 0 10px rgba(0,0,0,0.7), 0 0 10px ${bubble.colorHex}55`,
            }}>
              {bubble.spriteData && <FishPortrait spriteData={bubble.spriteData} size={68} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: '0.85rem', color: bubble.colorHex || '#1a1a2e',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                marginBottom: 4,
                lineHeight: 1.2,
              }}>
                {bubble.speaker?.name}
              </div>
              <div style={{
                fontSize: '0.95rem',
                color: '#222',
                lineHeight: 1.5,
                fontWeight: 500,
                fontFamily: "'Jost', sans-serif",
                wordBreak: 'break-word',
              }}>
                {bubble.text?.replace(`${bubble.speaker?.name}: `, '')}
              </div>
            </div>
          </div>
        </div>

        <BubbleTail colorHex={bubble.colorHex} />
      </div>
    </div>
  );
}

export default function ChatBubbleSystem({ bubbleQueue, onDismiss, camZoom = 3, heroSpriteOffset }) {
  if (!bubbleQueue || bubbleQueue.length === 0) return null;

  const bubbleScale = Math.max(0.5, 1.0 / camZoom);
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
      minWidth: 240,
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
