import React, { useState, useEffect, useRef, useCallback } from 'react';

function SpriteFace({ spriteData, size = 28 }) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const idleAnim = spriteData?.idle;

  useEffect(() => {
    if (!idleAnim) return;
    let f = 0;
    intervalRef.current = setInterval(() => {
      f = (f + 1) % (idleAnim.frames || 1);
      setFrame(f);
    }, 150);
    return () => clearInterval(intervalRef.current);
  }, [idleAnim]);

  if (!idleAnim) return null;

  const frameWidth = spriteData?.frameWidth || 100;
  const frameHeight = spriteData?.frameHeight || 100;
  const scale = size / Math.min(frameWidth, frameHeight) * 2.2;

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
        backgroundPosition: `-${frame * frameWidth * scale}px -${frameHeight * scale * 0.05}px`,
        imageRendering: 'pixelated',
        transform: 'translate(-30%, -15%)',
        filter: spriteData?.filter || 'none',
      }} />
    </div>
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

  return (
    <div
      ref={bubbleRef}
      style={{
        transition: 'transform 0.35s ease, opacity 0.3s ease',
        opacity,
        transform: `translateY(${yShift}px)`,
        pointerEvents: 'auto',
        cursor: 'pointer',
        marginBottom: 6,
        maxWidth: 320,
        minWidth: 180,
        width: 'auto',
      }}
      onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
    >
      <div style={{
        position: 'relative',
        filter: 'drop-shadow(2px 3px 0px rgba(0,0,0,0.5))',
      }}>
        <div style={{
          background: '#fffef5',
          border: '3px solid #111',
          borderRadius: 18,
          padding: '8px 12px 8px 10px',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${bubble.colorHex}`,
              overflow: 'hidden', flexShrink: 0,
              background: '#2a2a4a',
              boxShadow: `inset 0 0 4px rgba(0,0,0,0.6), 0 0 6px ${bubble.colorHex}44`,
              marginTop: 2,
            }}>
              {bubble.spriteData && <SpriteFace spriteData={bubble.spriteData} size={36} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: '0.7rem', color: bubble.colorHex || '#1a1a2e',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                marginBottom: 2,
                lineHeight: 1.2,
              }}>
                {bubble.speaker?.name}
              </div>
              <div style={{
                fontSize: '0.82rem',
                color: '#222',
                lineHeight: 1.4,
                fontWeight: 500,
                fontFamily: "'Jost', sans-serif",
                wordBreak: 'break-word',
              }}>
                {bubble.text?.replace(`${bubble.speaker?.name}: `, '')}
              </div>
            </div>
          </div>
        </div>

        <svg
          width="24"
          height="14"
          viewBox="0 0 24 14"
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: -3,
            left: 24,
            display: 'block',
            overflow: 'visible',
          }}
        >
          <path
            d="M 4 0 C 6 6, 9 11, 12 14 C 15 11, 18 6, 20 0"
            fill="#fffef5"
            stroke="#111"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <line x1="5" y1="0" x2="19" y2="0" stroke="#fffef5" strokeWidth="4" />
        </svg>
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
      paddingBottom: 12,
      minWidth: 180,
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
