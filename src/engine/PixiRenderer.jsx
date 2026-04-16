import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Assets, AnimatedSprite, Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { extractRow, extractGrid } from './SpriteSheet';

export function useGameLoop(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const tickerRef = useRef(null);

  const attach = useCallback((app) => {
    if (!app) return;
    const fn = (ticker) => {
      callbackRef.current(ticker.deltaTime, ticker.elapsedMS);
    };
    tickerRef.current = fn;
    app.ticker.add(fn);
  }, []);

  const detach = useCallback((app) => {
    if (!app || !tickerRef.current) return;
    app.ticker.remove(tickerRef.current);
    tickerRef.current = null;
  }, []);

  return { attach, detach };
}

export function usePixiApp(canvasRef, options = {}) {
  const appRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { width = 800, height = 600, backgroundColor = 0x000000, antialias = false } = options;

  useEffect(() => {
    if (!canvasRef.current) return;
    let destroyed = false;

    const app = new Application();
    appRef.current = app;

    app.init({
      canvas: canvasRef.current,
      width,
      height,
      backgroundColor,
      antialias,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      roundPixels: true,
    }).then(() => {
      if (destroyed) {
        app.destroy(true);
        return;
      }
      setReady(true);
    });

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      setReady(false);
    };
  }, [canvasRef, width, height, backgroundColor, antialias]);

  return { app: appRef.current, ready };
}

export async function loadSpriteSheet(src) {
  const texture = await Assets.load(src);
  return texture;
}

export function createAnimatedSprite(baseTexture, frameWidth, frameHeight, row, startCol, numFrames, options = {}) {
  const frames = extractRow(baseTexture, frameWidth, frameHeight, row, startCol, numFrames);
  const sprite = new AnimatedSprite(frames);
  sprite.animationSpeed = options.speed || 0.15;
  sprite.loop = options.loop !== false;
  sprite.anchor.set(options.anchorX ?? 0.5, options.anchorY ?? 1);
  if (options.autoPlay !== false) sprite.play();
  return sprite;
}

export function createParticlePool(container, count, createFn) {
  const pool = [];
  for (let i = 0; i < count; i++) {
    const p = createFn(i);
    p.visible = false;
    container.addChild(p);
    pool.push(p);
  }
  return pool;
}

export function PixiCanvas({ width, height, className, style, onReady }) {
  const canvasRef = useRef(null);
  const { app, ready } = usePixiApp(canvasRef, { width, height });

  useEffect(() => {
    if (ready && app && onReady) {
      onReady(app);
    }
  }, [ready, app, onReady]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    />
  );
}

export { AnimatedSprite, Container, Sprite, Graphics, Text, TextStyle, Assets };
