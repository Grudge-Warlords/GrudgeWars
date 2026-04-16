import React, { useEffect, useRef, useState, useMemo } from 'react';

function rand(min, max) { return Math.random() * (max - min) + min; }

function createBubble(width, height) {
  const size = rand(3, 10);
  return {
    id: Math.random(),
    x: rand(0, width),
    y: height + size,
    size,
    speedY: rand(15, 40),
    wobbleAmp: rand(3, 12),
    wobbleFreq: rand(1.5, 4),
    wobbleOffset: rand(0, Math.PI * 2),
    opacity: rand(0.15, 0.5),
    born: performance.now(),
  };
}

export default function BubbleEmitter({
  sources = [],
  density = 0.4,
  ambient = 4,
  style,
}) {
  const canvasRef = useRef(null);
  const bubblesRef = useRef([]);
  const animRef = useRef(null);
  const lastSpawnRef = useRef({});

  const stableSources = useMemo(() => sources, [JSON.stringify(sources)]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const tick = (now) => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) { animRef.current = requestAnimationFrame(tick); return; }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      stableSources.forEach((src, i) => {
        const key = src.id || i;
        const last = lastSpawnRef.current[key] || 0;
        const interval = (1 / (src.rate || density)) * 1000;
        if (now - last > interval && Math.random() < 0.7) {
          const px = (src.x / 100) * w;
          const py = (src.y / 100) * h;
          const size = rand(src.minSize || 2, src.maxSize || 7);
          bubblesRef.current.push({
            id: Math.random(),
            x: px + rand(-12, 12),
            y: py,
            size,
            speedY: rand(12, 30),
            wobbleAmp: rand(2, 8),
            wobbleFreq: rand(1.5, 3.5),
            wobbleOffset: rand(0, Math.PI * 2),
            opacity: rand(0.2, 0.55),
            born: now,
            tint: src.color || null,
          });
          lastSpawnRef.current[key] = now;
        }
      });

      if (ambient > 0) {
        const ambientKey = '__ambient';
        const last = lastSpawnRef.current[ambientKey] || 0;
        const interval = (1 / ambient) * 1000;
        if (now - last > interval) {
          bubblesRef.current.push(createBubble(w, h));
          lastSpawnRef.current[ambientKey] = now;
        }
      }

      const dt = 1 / 60;
      const alive = [];
      for (const b of bubblesRef.current) {
        const age = (now - b.born) / 1000;
        b.y -= b.speedY * dt;
        const wx = Math.sin(age * b.wobbleFreq + b.wobbleOffset) * b.wobbleAmp;

        if (b.y + b.size < -20) continue;

        const fadeIn = Math.min(age / 0.3, 1);
        const alpha = b.opacity * fadeIn;

        ctx.beginPath();
        ctx.arc(b.x + wx, b.y, b.size, 0, Math.PI * 2);

        if (b.tint) {
          ctx.fillStyle = b.tint;
          ctx.globalAlpha = alpha * 0.3;
          ctx.fill();
        }

        ctx.strokeStyle = `rgba(180, 230, 255, ${alpha * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 1;
        ctx.stroke();

        const grad = ctx.createRadialGradient(
          b.x + wx - b.size * 0.3, b.y - b.size * 0.3, 0,
          b.x + wx, b.y, b.size
        );
        grad.addColorStop(0, `rgba(220, 245, 255, ${alpha * 0.6})`);
        grad.addColorStop(0.5, `rgba(140, 210, 240, ${alpha * 0.15})`);
        grad.addColorStop(1, `rgba(100, 180, 220, 0)`);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1;
        ctx.fill();

        alive.push(b);
      }
      bubblesRef.current = alive;

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [stableSources, density, ambient]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        zIndex: 4,
        ...style,
      }}
    />
  );
}
