import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

function FishWatermark({ spriteData, accent }) {
  const idleAnim = spriteData?.idle;
  if (!idleAnim) return null;

  const frameWidth = spriteData?.frameWidth || 48;
  const frameHeight = spriteData?.frameHeight || 48;
  const sc = 4.5;

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: frameWidth * sc,
      height: frameHeight * sc,
      opacity: 0.18,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      filter: `blur(1px) drop-shadow(0 0 12px ${accent})`,
    }}>
      <div style={{
        width: frameWidth * sc,
        height: frameHeight * sc,
        backgroundImage: `url(${idleAnim.src})`,
        backgroundSize: `${frameWidth * (idleAnim.frames || 1) * sc}px ${frameHeight * sc}px`,
        backgroundPosition: '0px 0px',
        imageRendering: 'pixelated',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) scaleX(-1)',
      }} />
    </div>
  );
}

function FishMiniPortrait({ spriteData, size = 28 }) {
  const idleAnim = spriteData?.idle;
  if (!idleAnim) return null;
  const fw = spriteData?.frameWidth || 48;
  const fh = spriteData?.frameHeight || 48;
  const sc = (size / Math.min(fw, fh)) * 2.2;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: fw * sc, height: fh * sc,
        backgroundImage: `url(${idleAnim.src})`,
        backgroundSize: `${fw * (idleAnim.frames || 1) * sc}px ${fh * sc}px`,
        backgroundPosition: '0px 0px',
        imageRendering: 'pixelated',
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        filter: spriteData?.filter || 'none',
      }} />
    </div>
  );
}

function TravelingBubbles({ accent, active }) {
  const bubblesRef = useRef([]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 60, H = 70;
    canvas.width = W;
    canvas.height = H;

    const spawn = () => {
      bubblesRef.current.push({
        x: W / 2 + (Math.random() - 0.5) * 20,
        y: H,
        r: 2 + Math.random() * 3,
        speed: 0.6 + Math.random() * 0.8,
        wobble: Math.random() * Math.PI * 2,
        alpha: 0.4 + Math.random() * 0.4,
      });
    };

    let lastSpawn = 0;
    const tick = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (t - lastSpawn > 200) { spawn(); lastSpawn = t; }

      bubblesRef.current = bubblesRef.current.filter(b => {
        b.y -= b.speed;
        b.x += Math.sin(t / 400 + b.wobble) * 0.3;
        b.alpha -= 0.003;
        if (b.y < -5 || b.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = accent + Math.round(b.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        ctx.strokeStyle = accent + '44';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        return true;
      });

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active, accent]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 60, height: 70,
        pointerEvents: 'none',
        opacity: 0.7,
      }}
    />
  );
}

function TypewriterText({ text, speed = 32, onComplete, color }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    intervalRef.current = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          background: color || '#7dd3fc',
          marginLeft: 2,
          animation: 'blink-cursor 0.6s steps(2) infinite',
          verticalAlign: 'text-bottom',
        }} />
      )}
    </span>
  );
}

function FloatingBubble({ bubble, index, totalVisible, onDismiss, viewportW, viewportH }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [typing, setTyping] = useState(true);
  const elemRef = useRef(null);
  const startTime = useRef(Date.now());
  const seedRef = useRef(Math.random() * Math.PI * 2);
  const animRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const seed = seedRef.current;
    const tick = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;

      const riseSpeed = 6 + Math.sin(seed * 3) * 3;
      const yRaw = -elapsed * riseSpeed;
      const vH = viewportH || 400;
      const maxRise = Math.max(-(vH * 0.55), -140 - (index * 30));
      const y = Math.max(maxRise, yRaw * (1 - Math.min(1, Math.abs(yRaw) / (Math.abs(maxRise) * 1.8))));

      const wobbleX = Math.sin(elapsed * 0.8 + seed) * 18
        + Math.sin(elapsed * 1.7 + seed * 2.3) * 8
        + Math.cos(elapsed * 0.5 + seed * 0.7) * 6;

      const wobbleRotate = Math.sin(elapsed * 0.6 + seed * 1.5) * 2.5;

      const scaleBreath = 1 + Math.sin(elapsed * 1.4 + seed) * 0.02;

      if (elemRef.current) {
        const maxX = (viewportW || 600) / 2 - 120;
        const clampedX = Math.max(-maxX, Math.min(maxX, wobbleX));
        const clampedY = Math.max(-(vH * 0.6), y);
        elemRef.current.style.transform =
          `translate(${clampedX}px, ${clampedY}px) rotate(${wobbleRotate}deg) scale(${scaleBreath})`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [index, viewportW]);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => { if (onDismiss) onDismiss(bubble.id); }, 400);
  }, [bubble.id, onDismiss]);

  useEffect(() => {
    if (bubble.autoExpire) {
      const t = setTimeout(handleDismiss, bubble.autoExpire);
      return () => clearTimeout(t);
    }
  }, [bubble.autoExpire, handleDismiss]);

  const opacity = exiting ? 0 : (visible ? 1 : 0);
  const accent = bubble.colorHex || '#40c9ff';
  const cleanText = (bubble.text || '').replace(`${bubble.speaker?.name}: `, '');

  const bubbleStyle = useMemo(() => ({
    position: 'relative',
    background: `radial-gradient(ellipse at 35% 20%, ${accent}18, rgba(15,30,55,0.55) 50%, rgba(8,16,35,0.5) 80%)`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1.5px solid ${accent}55`,
    borderRadius: '50%',
    padding: '22px 26px 24px 26px',
    overflow: 'hidden',
    boxShadow: `
      0 0 30px ${accent}20,
      inset 0 2px 0 rgba(255,255,255,0.12),
      inset 0 -3px 10px rgba(0,0,0,0.15),
      0 6px 24px rgba(0,0,0,0.3)
    `,
    minWidth: 150,
    maxWidth: 420,
    width: 'max-content',
    aspectRatio: 'auto',
  }), [accent]);

  return (
    <div
      ref={elemRef}
      style={{
        transition: exiting
          ? 'opacity 0.4s ease, filter 0.4s ease'
          : 'opacity 0.6s ease',
        opacity,
        filter: exiting ? 'blur(4px)' : 'none',
        pointerEvents: opacity > 0.3 ? 'auto' : 'none',
        cursor: 'pointer',
        marginBottom: 6,
        willChange: 'transform',
      }}
      onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
    >
      <div style={{
        position: 'relative',
        filter: `drop-shadow(0 0 10px ${accent}22)`,
      }}>
        <div style={{ position: 'relative' }}>
          <TravelingBubbles accent={accent} active={typing && visible} />
        </div>

        <div style={bubbleStyle}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 40%),
              radial-gradient(circle at 70% 75%, ${accent}0a 0%, transparent 35%)
            `,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }} />

          <div style={{
            position: 'absolute', top: '8%', left: '20%', width: '45%', height: '25%',
            background: `radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            transform: 'rotate(-8deg)',
          }} />

          <FishWatermark spriteData={bubble.spriteData} accent={accent} />

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              justifyContent: 'center',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                border: `1.5px solid ${accent}66`,
                overflow: 'hidden', flexShrink: 0,
                background: 'radial-gradient(ellipse at center, #162840, #0a1020)',
                boxShadow: `0 0 6px ${accent}33`,
              }}>
                {bubble.spriteData && <FishMiniPortrait spriteData={bubble.spriteData} size={26} />}
              </div>
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: '0.65rem',
                color: accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textShadow: `0 0 8px ${accent}55`,
                lineHeight: 1,
              }}>
                {bubble.speaker?.name}
              </span>
            </div>

            <div style={{
              fontSize: '0.86rem',
              color: '#c8e0ec',
              lineHeight: 1.6,
              fontWeight: 400,
              fontFamily: "'Jost', sans-serif",
              wordBreak: 'break-word',
              textAlign: 'center',
              letterSpacing: '0.015em',
              padding: '2px 2px 0',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              minHeight: '1.4em',
            }}>
              <TypewriterText
                text={cleanText}
                speed={28}
                color={accent}
                onComplete={() => setTyping(false)}
              />
            </div>
          </div>
        </div>

        <svg
          width="30" height="28" viewBox="0 0 30 28"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: -4,
            display: 'block',
            overflow: 'visible',
          }}
        >
          <circle cx="15" cy="6" r="6"
            fill={`rgba(15,30,55,0.45)`} stroke={accent + '40'} strokeWidth="1" />
          <circle cx="16" cy="16" r="3.5"
            fill={`rgba(15,30,55,0.35)`} stroke={accent + '30'} strokeWidth="0.8" />
          <circle cx="17" cy="23" r="2.2"
            fill={`rgba(15,30,55,0.25)`} stroke={accent + '20'} strokeWidth="0.6" />
        </svg>
      </div>
    </div>
  );
}

const cursorKeyframes = `
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`;

export default function ChatBubbleSystem({ bubbleQueue, onDismiss, camZoom = 3, heroSpriteOffset }) {
  const aiBubbles = useMemo(() =>
    (bubbleQueue || []).filter(b => b.isAI !== false),
    [bubbleQueue]
  );
  if (aiBubbles.length === 0) return null;

  const bubbleScale = Math.max(0.55, 1.3 / camZoom);
  const offsetX = heroSpriteOffset?.x || 0;
  const offsetY = heroSpriteOffset?.y || 0;

  return (
    <>
      <style>{cursorKeyframes}</style>
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
        paddingBottom: 24,
        minWidth: 160,
      }}>
        {aiBubbles.map((bubble, i) => (
          <FloatingBubble
            key={bubble.id}
            bubble={bubble}
            index={i}
            totalVisible={aiBubbles.length}
            onDismiss={onDismiss}
            viewportW={typeof window !== 'undefined' ? window.innerWidth : 600}
            viewportH={typeof window !== 'undefined' ? window.innerHeight : 400}
          />
        ))}
      </div>
    </>
  );
}
