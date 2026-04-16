import { useState, useEffect, useRef, useCallback } from 'react';
import { GKO_FIGHTERS, getFighterSheetPath } from '../../data/gkoFighters';

const FW = 64, FH = 64;
const ANIMS = {
  idle: { row: 0, frames: 6 },
  block: { row: 1, frames: 2 },
  stun: { row: 2, frames: 4 },
  hurt: { row: 3, frames: 2 },
  walk: { row: 4, frames: 4 },
  jab: { row: 5, frames: 4 },
  hook: { row: 6, frames: 4 },
  cross: { row: 7, frames: 4 },
  lowkick: { row: 8, frames: 4 },
  midkick: { row: 9, frames: 4 },
  ko: { row: 10, frames: 4 },
  win: { row: 11, frames: 4 },
};

function extractFrame(img, col, row, blockOff, rowOff) {
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, (col + blockOff) * FW, (row + rowOff) * FH, FW, FH, 0, 0, FW, FH);
  return c;
}

function blendFrames(frameA, frameB, t) {
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const ctx = c.getContext('2d');
  ctx.globalAlpha = 1 - t;
  ctx.drawImage(frameA, 0, 0);
  ctx.globalAlpha = t;
  ctx.drawImage(frameB, 0, 0);
  return c;
}

function applyOutline(frameCanvas, color = '#000000', thickness = 1) {
  const c = document.createElement('canvas');
  const pad = thickness * 2;
  c.width = FW + pad; c.height = FH + pad;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const offsets = [];
  for (let dx = -thickness; dx <= thickness; dx++) {
    for (let dy = -thickness; dy <= thickness; dy++) {
      if (dx === 0 && dy === 0) continue;
      offsets.push([dx, dy]);
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  offsets.forEach(([dx, dy]) => {
    ctx.drawImage(frameCanvas, thickness + dx, thickness + dy);
  });

  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(frameCanvas, thickness, thickness);
  return c;
}

function applyDropShadow(frameCanvas, offsetX = 2, offsetY = 2, color = 'rgba(0,0,0,0.5)') {
  const c = document.createElement('canvas');
  c.width = FW + 4; c.height = FH + 4;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.globalAlpha = 0.5;
  ctx.drawImage(frameCanvas, offsetX + 2, offsetY + 2);
  const sd = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < sd.data.length; i += 4) {
    if (sd.data[i + 3] > 0) { sd.data[i] = 0; sd.data[i + 1] = 0; sd.data[i + 2] = 0; }
  }
  ctx.putImageData(sd, 0, 0);

  ctx.globalAlpha = 1;
  ctx.drawImage(frameCanvas, 2, 2);
  return c;
}

function applyGradientMap(frameCanvas, colorA, colorB) {
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const ctx = c.getContext('2d');
  ctx.drawImage(frameCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, FW, FH);
  const d = imgData.data;
  const rA = parseInt(colorA.slice(1, 3), 16), gA = parseInt(colorA.slice(3, 5), 16), bA = parseInt(colorA.slice(5, 7), 16);
  const rB = parseInt(colorB.slice(1, 3), 16), gB = parseInt(colorB.slice(3, 5), 16), bB = parseInt(colorB.slice(5, 7), 16);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    d[i] = rA + (rB - rA) * lum;
    d[i + 1] = gA + (gB - gA) * lum;
    d[i + 2] = bA + (bB - bA) * lum;
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}

function interpolateFrames(frames, insertCount = 1) {
  const result = [];
  for (let i = 0; i < frames.length; i++) {
    result.push(frames[i]);
    if (i < frames.length - 1) {
      for (let j = 1; j <= insertCount; j++) {
        const t = j / (insertCount + 1);
        result.push(blendFrames(frames[i], frames[i + 1], t));
      }
    }
  }
  return result;
}

function OnionSkinPreview({ img, fighter, animKey }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const anim = ANIMS[animKey] || ANIMS.idle;
    const blockOff = fighter.blockOffset || 0;
    const rowOff = fighter.rowOffset || 0;
    let frame = 0;
    let last = 0;

    const tick = (t) => {
      if (t - last > 120) {
        frame = (frame + 1) % anim.frames;
        last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        for (let ghost = -2; ghost <= 2; ghost++) {
          if (ghost === 0) continue;
          const gf = ((frame + ghost) % anim.frames + anim.frames) % anim.frames;
          ctx.save();
          ctx.globalAlpha = ghost < 0 ? 0.15 : 0.1;
          ctx.filter = ghost < 0 ? 'hue-rotate(200deg) brightness(0.7)' : 'hue-rotate(-30deg) brightness(0.7)';
          const gx = (ghost * 16) + canvas.width / 2 - FW * 2;
          ctx.drawImage(img, (gf + blockOff) * FW, (anim.row + rowOff) * FH, FW, FH, gx, 8, FW * 4, FH * 4);
          ctx.restore();
        }

        ctx.drawImage(img, (frame + blockOff) * FW, (anim.row + rowOff) * FH, FW, FH, canvas.width / 2 - FW * 2, 8, FW * 4, FH * 4);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [img, fighter, animKey]);

  return <canvas ref={canvasRef} width={400} height={280} style={{ background: '#0a0a0a', borderRadius: 6, imageRendering: 'pixelated' }} />;
}

function InterpolationPreview({ img, fighter, animKey }) {
  const canvasRef = useRef(null);
  const [interpFrames, setInterpFrames] = useState(1);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const anim = ANIMS[animKey] || ANIMS.idle;
    const blockOff = fighter.blockOffset || 0;
    const rowOff = fighter.rowOffset || 0;

    const rawFrames = [];
    for (let i = 0; i < anim.frames; i++) {
      rawFrames.push(extractFrame(img, i + blockOff, anim.row + rowOff, 0, 0));
    }
    const allFrames = interpolateFrames(rawFrames, interpFrames);

    let frame = 0;
    let last = 0;
    const speed = 80;

    const tick = (t) => {
      if (t - last > speed) {
        frame = (frame + 1) % allFrames.length;
        last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(allFrames[frame], 0, 0, FW, FH, 20, 20, FW * 4, FH * 4);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px Jost, sans-serif';
        ctx.fillText(`Frame ${frame + 1}/${allFrames.length} (${rawFrames.length} orig + ${allFrames.length - rawFrames.length} interp)`, 20, canvas.height - 10);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [img, fighter, animKey, interpFrames]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>Interpolated frames between each original:</span>
        {[1, 2, 3].map(n => (
          <button key={n} onClick={() => setInterpFrames(n)} style={{
            background: interpFrames === n ? '#3b82f6' : '#1e293b',
            color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4,
            padding: '2px 10px', cursor: 'pointer', fontSize: 12,
          }}>{n}</button>
        ))}
      </div>
      <canvas ref={canvasRef} width={320} height={300} style={{ background: '#0a0a0a', borderRadius: 6, imageRendering: 'pixelated' }} />
    </div>
  );
}

function EffectsPreview({ img, fighter, animKey }) {
  const canvasRef = useRef(null);
  const [effect, setEffect] = useState('outline');
  const [outlineColor, setOutlineColor] = useState('#ffffff');
  const [gradA, setGradA] = useState('#000033');
  const [gradB, setGradB] = useState('#ff6600');
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const anim = ANIMS[animKey] || ANIMS.idle;
    const blockOff = fighter.blockOffset || 0;
    const rowOff = fighter.rowOffset || 0;

    const rawFrames = [];
    for (let i = 0; i < anim.frames; i++) {
      rawFrames.push(extractFrame(img, i + blockOff, anim.row + rowOff, 0, 0));
    }

    let frame = 0;
    let last = 0;

    const tick = (t) => {
      if (t - last > 120) {
        frame = (frame + 1) % rawFrames.length;
        last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        let processed = rawFrames[frame];
        if (effect === 'outline') processed = applyOutline(rawFrames[frame], outlineColor, 1);
        else if (effect === 'shadow') processed = applyDropShadow(rawFrames[frame]);
        else if (effect === 'gradient') processed = applyGradientMap(rawFrames[frame], gradA, gradB);

        const scale = 4;
        const dw = processed.width * scale;
        const dh = processed.height * scale;
        ctx.drawImage(processed, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [img, fighter, animKey, effect, outlineColor, gradA, gradB]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {['none', 'outline', 'shadow', 'gradient'].map(e => (
          <button key={e} onClick={() => setEffect(e)} style={{
            background: effect === e ? '#a855f7' + '44' : '#1e293b',
            color: effect === e ? '#a855f7' : '#94a3b8',
            border: `1px solid ${effect === e ? '#a855f7' : '#334155'}`,
            borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize',
          }}>{e}</button>
        ))}
        {effect === 'outline' && (
          <input type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} style={{ width: 28, height: 24 }} />
        )}
        {effect === 'gradient' && (
          <>
            <input type="color" value={gradA} onChange={e => setGradA(e.target.value)} style={{ width: 28, height: 24 }} />
            <span style={{ color: '#64748b' }}>to</span>
            <input type="color" value={gradB} onChange={e => setGradB(e.target.value)} style={{ width: 28, height: 24 }} />
          </>
        )}
      </div>
      <canvas ref={canvasRef} width={320} height={300} style={{ background: '#0a0a0a', borderRadius: 6, imageRendering: 'pixelated' }} />
    </div>
  );
}

function AnimationBlender({ img, fighter }) {
  const canvasRef = useRef(null);
  const [animA, setAnimA] = useState('jab');
  const [animB, setAnimB] = useState('cross');
  const [blendPoint, setBlendPoint] = useState(2);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const aA = ANIMS[animA] || ANIMS.idle;
    const aB = ANIMS[animB] || ANIMS.idle;
    const blockOff = fighter.blockOffset || 0;
    const rowOff = fighter.rowOffset || 0;

    const framesA = [];
    for (let i = 0; i < aA.frames; i++) framesA.push(extractFrame(img, i + blockOff, aA.row + rowOff, 0, 0));
    const framesB = [];
    for (let i = 0; i < aB.frames; i++) framesB.push(extractFrame(img, i + blockOff, aB.row + rowOff, 0, 0));

    const bp = Math.min(blendPoint, framesA.length - 1);
    const transition = blendFrames(framesA[bp], framesB[0], 0.5);
    const combined = [...framesA.slice(0, bp + 1), transition, ...framesB];

    let frame = 0;
    let last = 0;

    const tick = (t) => {
      if (t - last > 100) {
        frame = (frame + 1) % combined.length;
        last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(combined[frame], 0, 0, FW, FH, 20, 20, FW * 4, FH * 4);

        const isASection = frame <= bp;
        const isBlend = frame === bp + 1;
        ctx.fillStyle = isBlend ? '#f59e0b' : (isASection ? '#3b82f6' : '#22c55e');
        ctx.font = '11px Jost';
        const label = isBlend ? 'BLEND' : (isASection ? animA.toUpperCase() : animB.toUpperCase());
        ctx.fillText(`${label} | Frame ${frame + 1}/${combined.length}`, 20, canvas.height - 10);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [img, fighter, animA, animB, blendPoint]);

  const animKeys = Object.keys(ANIMS);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <select value={animA} onChange={e => setAnimA(e.target.value)} style={selStyle}>
          {animKeys.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
        </select>
        <span style={{ color: '#f59e0b' }}>blend into</span>
        <select value={animB} onChange={e => setAnimB(e.target.value)} style={selStyle}>
          {animKeys.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
        </select>
        <span style={{ color: '#64748b', fontSize: 12 }}>at frame</span>
        <input type="range" min={0} max={(ANIMS[animA]?.frames || 4) - 1} value={blendPoint} onChange={e => setBlendPoint(+e.target.value)} style={{ width: 80 }} />
        <span style={{ color: '#e2e8f0', fontSize: 12 }}>{blendPoint}</span>
      </div>
      <canvas ref={canvasRef} width={320} height={300} style={{ background: '#0a0a0a', borderRadius: 6, imageRendering: 'pixelated' }} />
    </div>
  );
}

function PaletteExtractor({ img, fighter }) {
  const [palette, setPalette] = useState([]);

  useEffect(() => {
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = FW; c.height = FH;
    const ctx = c.getContext('2d');
    const blockOff = fighter.blockOffset || 0;
    const rowOff = fighter.rowOffset || 0;
    ctx.drawImage(img, blockOff * FW, rowOff * FH, FW, FH, 0, 0, FW, FH);
    const data = ctx.getImageData(0, 0, FW, FH).data;

    const colorMap = {};
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([k, count]) => {
        const [r, g, b] = k.split(',').map(Number);
        return { hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`, count };
      });

    setPalette(sorted);
  }, [img, fighter]);

  return (
    <div>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>Extracted palette (top 16 colors by frequency):</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {palette.map((c, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 32, height: 32, background: c.hex, borderRadius: 4, border: '1px solid #334155' }} />
            <span style={{ color: '#64748b', fontSize: 9 }}>{c.hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const selStyle = {
  background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: 'Jost',
};

export default function SpriteTools() {
  const [selectedFighter, setSelectedFighter] = useState(GKO_FIGHTERS[0]);
  const [selectedAnim, setSelectedAnim] = useState('idle');
  const [activeTab, setActiveTab] = useState('onion');
  const [img, setImg] = useState(null);

  useEffect(() => {
    const image = new Image();
    image.src = getFighterSheetPath(selectedFighter);
    image.onload = () => setImg(image);
  }, [selectedFighter]);

  const tabs = [
    { id: 'onion', label: 'Onion Skin', color: '#06b6d4' },
    { id: 'interp', label: 'Frame Interpolation', color: '#22c55e' },
    { id: 'effects', label: 'Effects Pipeline', color: '#a855f7' },
    { id: 'blend', label: 'Animation Blender', color: '#f59e0b' },
    { id: 'palette', label: 'Palette Extractor', color: '#ef4444' },
  ];

  return (
    <div style={{ background: '#050a18', minHeight: '100vh', fontFamily: 'Jost, sans-serif', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', color: '#fbbf24', margin: 0, fontSize: 24 }}>
            SPRITE TOOLS
          </h1>
          <a href="/admin/gko-sprites" style={{ color: '#64748b', fontSize: 12, textDecoration: 'none' }}>Sprite Viewer</a>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Fighter:</span>
          {GKO_FIGHTERS.map(f => (
            <button key={f.id} onClick={() => setSelectedFighter(f)} style={{
              background: selectedFighter.id === f.id ? f.color + '33' : '#0f172a',
              color: selectedFighter.id === f.id ? f.color : '#64748b',
              border: `1px solid ${selectedFighter.id === f.id ? f.color : '#1e293b'}`,
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12,
              fontWeight: selectedFighter.id === f.id ? 700 : 400,
            }}>{f.name}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Animation:</span>
          {Object.keys(ANIMS).map(k => (
            <button key={k} onClick={() => setSelectedAnim(k)} style={{
              background: selectedAnim === k ? '#22d3ee22' : '#0f172a',
              color: selectedAnim === k ? '#22d3ee' : '#64748b',
              border: `1px solid ${selectedAnim === k ? '#22d3ee' : '#1e293b'}`,
              borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 11,
              textTransform: 'uppercase',
            }}>{k}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? tab.color + '22' : '#0f172a',
              color: activeTab === tab.id ? tab.color : '#94a3b8',
              border: `1px solid ${activeTab === tab.id ? tab.color : '#1e293b'}`,
              borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 400,
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
          {activeTab === 'onion' && (
            <div>
              <h3 style={{ color: '#06b6d4', fontFamily: 'Cinzel', margin: '0 0 8px' }}>Onion Skinning</h3>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>
                Ghost frames show previous (blue) and next (orange) frames overlaid on the current frame.
                Essential for understanding motion arcs and timing.
              </p>
              <OnionSkinPreview img={img} fighter={selectedFighter} animKey={selectedAnim} />
            </div>
          )}
          {activeTab === 'interp' && (
            <div>
              <h3 style={{ color: '#22c55e', fontFamily: 'Cinzel', margin: '0 0 8px' }}>Frame Interpolation</h3>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>
                Generate smooth in-between frames by alpha blending adjacent keyframes.
                Doubles or triples animation smoothness without new art.
              </p>
              <InterpolationPreview img={img} fighter={selectedFighter} animKey={selectedAnim} />
            </div>
          )}
          {activeTab === 'effects' && (
            <div>
              <h3 style={{ color: '#a855f7', fontFamily: 'Cinzel', margin: '0 0 8px' }}>Effects Pipeline</h3>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>
                Non-destructive visual effects: outlines, drop shadows, and gradient recoloring.
                Stack effects for unique fighter looks.
              </p>
              <EffectsPreview img={img} fighter={selectedFighter} animKey={selectedAnim} />
            </div>
          )}
          {activeTab === 'blend' && (
            <div>
              <h3 style={{ color: '#f59e0b', fontFamily: 'Cinzel', margin: '0 0 8px' }}>Animation Blender</h3>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>
                Chain two animations together with a smooth blend transition frame.
                Perfect for creating combo sequences or cancel windows.
              </p>
              <AnimationBlender img={img} fighter={selectedFighter} />
            </div>
          )}
          {activeTab === 'palette' && (
            <div>
              <h3 style={{ color: '#ef4444', fontFamily: 'Cinzel', margin: '0 0 8px' }}>Palette Extractor</h3>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>
                Extract and visualize the dominant colors from any fighter sprite.
                Use for consistent color theming across UI and effects.
              </p>
              <PaletteExtractor img={img} fighter={selectedFighter} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
