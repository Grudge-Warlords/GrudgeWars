import React, { useState, useEffect, useRef, useCallback } from 'react';

function SpriteFace({ spriteData, size = 52 }) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const idleAnim = spriteData?.idle;

  useEffect(() => {
    if (!idleAnim) return;
    let f = 0;
    intervalRef.current = setInterval(() => {
      f = (f + 1) % (idleAnim.frames || 1);
      setFrame(f);
    }, 220);
    return () => clearInterval(intervalRef.current);
  }, [idleAnim]);

  if (!idleAnim) return null;

  const frameWidth = spriteData?.frameWidth || 100;
  const frameHeight = spriteData?.frameHeight || 100;
  const scale = size / Math.min(frameWidth, frameHeight) * 1.8;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      position: 'relative', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${idleAnim.src})`,
        backgroundSize: `${frameWidth * (idleAnim.frames || 1) * scale}px ${frameHeight * scale}px`,
        backgroundPosition: `-${frame * frameWidth * scale}px 0px`,
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

function ComicTail({ colorHex, side = 'left' }) {
  const flip = side === 'right';
  return (
    <svg
      width="48"
      height="36"
      viewBox="0 0 48 36"
      style={{
        position: 'absolute',
        top: '100%',
        marginTop: -4,
        [side]: 22,
        display: 'block',
        overflow: 'visible',
        transform: flip ? 'scaleX(-1)' : 'none',
      }}
    >
      <path
        d="M 6 0 C 8 4, 10 8, 8 14 C 6 18, 3 22, 6 26 C 8 29, 12 32, 16 35"
        fill="none"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 6 0 C 8 4, 10 8, 8 14 C 6 18, 3 22, 6 26 C 8 29, 12 32, 16 35"
        fill="none"
        stroke="#fffef5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="35" r="2.5" fill="#fffef5" stroke="#111" strokeWidth="2" />
      <circle cx="25" cy="33" r="1.5" fill="#fffef5" stroke="#111" strokeWidth="1.5" />
    </svg>
  );
}

function StackedBubble({ bubble, index, totalVisible, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const bubbleRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
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
  const yShift = exiting ? -20 : (visible ? 0 : 15);
  const tailSide = index % 2 === 0 ? 'left' : 'right';

  return (
    <div
      ref={bubbleRef}
      style={{
        transition: 'transform 0.35s ease, opacity 0.3s ease',
        opacity,
        transform: `translateY(${yShift}px)`,
        pointerEvents: 'auto',
        cursor: 'pointer',
        marginBottom: 18,
        maxWidth: 340,
        minWidth: 200,
        width: 'auto',
      }}
      onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
    >
      <div style={{
        position: 'relative',
        filter: 'drop-shadow(2px 4px 1px rgba(0,0,0,0.45))',
      }}>
        <div style={{
          background: '#fffef5',
          border: '3px solid #111',
          borderRadius: 22,
          padding: '10px 14px 10px 10px',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: `3px solid ${bubble.colorHex}`,
              overflow: 'hidden', flexShrink: 0,
              background: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0a1428 100%)',
              boxShadow: `inset 0 0 8px rgba(0,0,0,0.7), 0 0 8px ${bubble.colorHex}55`,
            }}>
              {bubble.spriteData && <SpriteFace spriteData={bubble.spriteData} size={56} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: '0.72rem', color: bubble.colorHex || '#1a1a2e',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                marginBottom: 3,
                lineHeight: 1.2,
              }}>
                {bubble.speaker?.name}
              </div>
              <div style={{
                fontSize: '0.84rem',
                color: '#222',
                lineHeight: 1.45,
                fontWeight: 500,
                fontFamily: "'Jost', sans-serif",
                wordBreak: 'break-word',
              }}>
                {bubble.text?.replace(`${bubble.speaker?.name}: `, '')}
              </div>
            </div>
          </div>
        </div>

        <ComicTail colorHex={bubble.colorHex} side={tailSide} />
      </div>
    </div>
  );
}

export default function ChatBubbleSystem({ bubbleQueue, onDismiss, camZoom = 3 }) {
  if (!bubbleQueue || bubbleQueue.length === 0) return null;

  const bubbleScale = Math.max(0.5, 1.0 / camZoom);

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      bottom: '100%',
      transform: `translateX(-50%) scale(${bubbleScale})`,
      transformOrigin: 'bottom center',
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 9500,
      paddingBottom: 20,
      minWidth: 200,
    }}>
      {bubbleQueue.map((bubble, i) => (
        <StackedBubble
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
