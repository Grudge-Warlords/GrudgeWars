import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
  isImageFile, isGifFile, isSvgFile, getSpriteFileExtensions,
  loadImageDimensions, detectGridLayout, detectFrameSeparators,
  assembleFramesIntoSheet, removeBackground, normalizeFrameSize,
  detectDuplicateFrames, suggestAnimationSpeed, extractColorPalette,
} from '../utils/spriteProcessing.js';
import { puterAuth, puterAI, puterFS, isPuterAvailable } from '../../utils/puterService.js';

const ANIM_KEYWORDS = {
  idle: ['idle', 'stand', 'breathe', 'rest', 'wait'],
  walk: ['walk', 'run', 'move', 'stride', 'step'],
  attack1: ['attack1', 'attack_1', 'slash', 'swing', 'strike', 'atk1'],
  attack2: ['attack2', 'attack_2', 'heavy', 'special', 'atk2', 'skill'],
  attack3: ['attack3', 'attack_3', 'atk3', 'combo'],
  hurt: ['hurt', 'hit', 'take_hit', 'takehit', 'gethit', 'damage', 'pain'],
  death: ['death', 'die', 'dead', 'defeat', 'fall'],
  block: ['block', 'shield', 'guard', 'defend', 'parry'],
  jump: ['jump', 'leap', 'spring'],
  fall: ['fall', 'drop', 'descend'],
  cast: ['cast', 'spell', 'magic', 'channel'],
};

function classifyByFilename(filename) {
  const lower = filename.replace(/\.[^.]+$/, '').toLowerCase().replace(/[\s_-]+/g, '_');
  for (const [anim, keywords] of Object.entries(ANIM_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower === kw || lower.endsWith('_' + kw) || lower.startsWith(kw + '_') || lower.includes('/' + kw)) {
        return anim;
      }
    }
  }
  if (/attack/i.test(lower)) return 'attack1';
  return null;
}

async function aiClassifySprites(fileGroups, aiChat) {
  const fileSummary = Object.entries(fileGroups).map(([folder, files]) => {
    return `Folder: "${folder}"\nFiles: ${files.map(f => f.name).join(', ')}`;
  }).join('\n\n');

  const prompt = `You are a pixel art sprite sheet analyzer for an RPG game engine.

Given these sprite files organized by folder, classify each file into one of these animation categories:
idle, walk, attack1, attack2, attack3, hurt, death, block, jump, fall, cast

Also identify the character/entity name for each folder group.

Files:
${fileSummary}

Return ONLY a valid JSON object with this format:
{
  "groups": [
    {
      "folder": "folder_name",
      "entityName": "detected_character_name",
      "entityType": "hero|enemy|npc|effect|building|terrain|vehicle|icon",
      "animations": {
        "filename.png": "idle",
        "filename2.png": "attack1"
      }
    }
  ]
}`;

  try {
    const result = await aiChat(prompt);
    if (!result) return null;
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {
    console.warn('AI classification failed:', e);
  }
  return null;
}

function SpritePreview({ spriteData, animKey, scale = 2, squareViewport = false, showZoom = false }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(() => suggestAnimationSpeed(animKey));
  const [zoom, setZoom] = useState(scale);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const anim = spriteData?.[animKey];
  const totalFrames = anim?.frames || 1;
  const frameWidth = anim?.frameWidth || spriteData?.frameWidth || 100;
  const frameHeight = anim?.frameHeight || spriteData?.frameHeight || 100;
  const isVertical = anim?.type === 'vertical_strip';
  const isGrid = anim?.type === 'grid';
  const gridCols = anim?.gridCols || totalFrames;
  const isSvg = anim?.src && (anim.src.includes('.svg') || anim.isSvg);

  const viewSize = squareViewport ? Math.max(frameWidth, frameHeight) * zoom : null;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!playing || totalFrames <= 1) return;
    let f = 0;
    setFrame(0);
    intervalRef.current = setInterval(() => {
      f = (f + 1) % totalFrames;
      setFrame(f);
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, totalFrames, speed, animKey]);

  useEffect(() => {
    if (!anim?.src || isSvg) return;
    const img = new Image();
    img.onload = () => { imgRef.current = img; };
    img.src = anim.src;
  }, [anim?.src, isSvg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || isSvg) return;

    const dw = frameWidth * zoom;
    const dh = frameHeight * zoom;
    const cw = squareViewport ? viewSize : dw;
    const ch = squareViewport ? viewSize : dh;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const checkSize = 8;
    for (let y = 0; y < ch; y += checkSize) {
      for (let x = 0; x < cw; x += checkSize) {
        const isLight = ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2) === 0;
        ctx.fillStyle = isLight ? 'rgba(60,60,60,0.5)' : 'rgba(40,40,40,0.5)';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    let sx = 0, sy = 0;
    if (isGrid) {
      sx = (frame % gridCols) * frameWidth;
      sy = Math.floor(frame / gridCols) * frameHeight;
    } else if (isVertical) {
      sy = frame * frameHeight;
    } else {
      sx = frame * frameWidth;
    }

    const ox = squareViewport ? Math.floor((cw - dw) / 2) : 0;
    const oy = squareViewport ? Math.floor((ch - dh) / 2) : 0;
    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, ox, oy, dw, dh);
  }, [frame, zoom, anim?.src, frameWidth, frameHeight, isGrid, isVertical, gridCols, totalFrames, isSvg, squareViewport, viewSize]);

  if (!anim) return <div style={{ color: '#999', padding: 8 }}>No animation data</div>;

  const displayWidth = squareViewport ? viewSize : frameWidth * zoom;
  const displayHeight = squareViewport ? viewSize : frameHeight * zoom;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {isSvg ? (
        <img src={anim.src} alt="svg sprite" style={{
          width: frameWidth * zoom, height: frameHeight * zoom, imageRendering: 'auto',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.3)',
        }} />
      ) : (
        <canvas
          ref={canvasRef}
          style={{
            width: displayWidth, height: displayHeight,
            imageRendering: 'pixelated',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => setPlaying(!playing)} style={miniBtn}>
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => setFrame(f => (f - 1 + totalFrames) % totalFrames)} style={miniBtn}>◀</button>
        <button onClick={() => setFrame(f => (f + 1) % totalFrames)} style={miniBtn}>▶</button>
        <span style={{ color: '#ccc', fontSize: 11 }}>
          {frame + 1}/{totalFrames}
        </span>
        <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={miniSelect}>
          <option value={50}>Fastest</option>
          <option value={80}>Fast</option>
          <option value={120}>Normal</option>
          <option value={200}>Slow</option>
          <option value={400}>Very Slow</option>
        </select>
        {showZoom && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[1, 2, 4, 8].map(z => (
              <button key={z} onClick={() => setZoom(z)} style={zoom === z ? { ...miniBtn, background: 'rgba(212,168,67,0.3)', borderColor: 'rgba(212,168,67,0.5)' } : miniBtn}>
                {z}x
              </button>
            ))}
          </div>
        )}
      </div>
      {squareViewport && (
        <div style={{ fontSize: 10, color: '#888' }}>
          {frameWidth}x{frameHeight}px · {zoom}x zoom
        </div>
      )}
    </div>
  );
}

const miniBtn = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  borderRadius: 4,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: 12,
};

const miniSelect = {
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  borderRadius: 4,
  padding: '2px 4px',
  fontSize: 11,
};

const LAYOUT_LABELS = {
  horizontal_strip: 'H-Strip',
  vertical_strip: 'V-Strip',
  grid: 'Grid',
  single_frame: 'Single',
};

const TYPE_COLORS = {
  hero: '#2d6a4f', enemy: '#6a2d2d', npc: '#4a3d6a', effect: '#6a5a2d',
  building: '#2d4a6a', terrain: '#3a6a3a', vehicle: '#5a3a6a', icon: '#6a4a2d',
};

export default function SpriteAIWorker() {
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [spriteGroups, setSpriteGroups] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedAnim, setSelectedAnim] = useState('idle');
  const [generatedConfig, setGeneratedConfig] = useState(null);
  const [exportedJSON, setExportedJSON] = useState('');
  const [viewMode, setViewMode] = useState('groups');
  const [duplicateResults, setDuplicateResults] = useState({});
  const [slicerTarget, setSlicerTarget] = useState(null);
  const [slicerCols, setSlicerCols] = useState(4);
  const [slicerRows, setSlicerRows] = useState(4);
  const [aiReview, setAiReview] = useState(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [colorPalettes, setColorPalettes] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [showSheetOverlay, setShowSheetOverlay] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [puterSignedIn, setPuterSignedIn] = useState(false);
  const [cloudSaveStatus, setCloudSaveStatus] = useState('');
  const fileInputRef = useRef(null);
  const looseFileInputRef = useRef(null);
  const quickImportRef = useRef(null);
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isPuterAvailable()) {
      try {
        setPuterSignedIn(puterAuth.isSignedIn());
      } catch { setPuterSignedIn(false); }
    }
  }, []);

  const ensurePuterAuth = useCallback(async () => {
    if (!isPuterAvailable()) {
      setProgress('Puter.js SDK not available');
      return false;
    }
    if (puterAuth.isSignedIn()) {
      setPuterSignedIn(true);
      return true;
    }
    try {
      await puterAuth.signIn();
      setPuterSignedIn(true);
      return true;
    } catch (e) {
      setProgress('Puter sign-in cancelled or failed');
      return false;
    }
  }, []);

  const handleGenerateSprite = useCallback(async () => {
    if (!generatePrompt.trim()) return;
    const authed = await ensurePuterAuth();
    if (!authed) return;
    setGenerateLoading(true);
    setProgress('Generating sprite from text prompt...');
    try {
      const result = await puterAI.txt2img(generatePrompt.trim());
      if (result) {
        let imgUrl;
        if (result instanceof Blob) {
          imgUrl = URL.createObjectURL(result);
          blobUrlsRef.current.push(imgUrl);
        } else if (typeof result === 'string') {
          imgUrl = result;
        } else if (result.url) {
          imgUrl = result.url;
        } else if (result.src) {
          imgUrl = result.src;
        }
        setGeneratedImage({ url: imgUrl, prompt: generatePrompt.trim(), blob: result instanceof Blob ? result : null });
        setProgress('Sprite generated successfully!');
      } else {
        setProgress('No image returned from AI');
      }
    } catch (err) {
      setProgress('Generation failed: ' + err.message);
    } finally {
      setGenerateLoading(false);
    }
  }, [generatePrompt, ensurePuterAuth]);

  const handleAnalyzeSprite = useCallback(async (groupKey, animKey) => {
    const authed = await ensurePuterAuth();
    if (!authed) return;
    const anim = spriteGroups[groupKey]?.animations[animKey];
    if (!anim?.src) return;
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    setProgress(`Analyzing sprite "${animKey}" with AI...`);
    try {
      const result = await puterAI.img2txt(anim.src);
      const text = typeof result === 'string' ? result : result?.text || result?.description || JSON.stringify(result);
      setAnalyzeResult({ groupKey, animKey, text });
      setProgress('Sprite analysis complete');
    } catch (err) {
      setProgress('Analysis failed: ' + err.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }, [spriteGroups, ensurePuterAuth]);

  const handleSaveToCloud = useCallback(async (groupKey, animKey) => {
    const authed = await ensurePuterAuth();
    if (!authed) return;
    const group = spriteGroups[groupKey];
    const anim = group?.animations[animKey];
    if (!anim?.blob) {
      setProgress('No blob data available for this sprite');
      return;
    }
    setCloudSaveStatus('saving');
    setProgress(`Saving "${animKey}" to Puter cloud...`);
    try {
      const dirPath = `/sprites/${group.entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      try { await puterFS.mkdir(dirPath); } catch {}
      const ext = anim.originalFormat === 'svg' ? 'svg' : 'png';
      const filePath = `${dirPath}/${animKey}.${ext}`;
      await puterFS.write(filePath, anim.blob);
      setCloudSaveStatus('saved');
      setProgress(`Saved to ${filePath}`);
      setTimeout(() => setCloudSaveStatus(''), 3000);
    } catch (err) {
      setCloudSaveStatus('error');
      setProgress('Cloud save failed: ' + err.message);
      setTimeout(() => setCloudSaveStatus(''), 3000);
    }
  }, [spriteGroups, ensurePuterAuth]);

  const handleExportAllToCloud = useCallback(async () => {
    const authed = await ensurePuterAuth();
    if (!authed) return;
    setCloudSaveStatus('saving');
    setProgress('Exporting all sprites to Puter cloud...');
    try {
      let saved = 0;
      for (const [folder, group] of Object.entries(spriteGroups)) {
        const dirPath = `/sprites/${group.entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        try { await puterFS.mkdir(dirPath); } catch {}
        for (const [animKey, anim] of Object.entries(group.animations)) {
          if (!anim.blob) continue;
          const ext = anim.originalFormat === 'svg' ? 'svg' : 'png';
          await puterFS.write(`${dirPath}/${animKey}.${ext}`, anim.blob);
          saved++;
          setProgress(`Saving sprites... (${saved} files)`);
        }
      }
      if (exportedJSON) {
        await puterFS.write('/sprites/spriteMap_config.json', new Blob([exportedJSON], { type: 'application/json' }));
      }
      setCloudSaveStatus('saved');
      setProgress(`Exported ${saved} sprite files to Puter cloud`);
      setTimeout(() => setCloudSaveStatus(''), 3000);
    } catch (err) {
      setCloudSaveStatus('error');
      setProgress('Export failed: ' + err.message);
      setTimeout(() => setCloudSaveStatus(''), 3000);
    }
  }, [spriteGroups, exportedJSON, ensurePuterAuth]);

  const processFiles = useCallback(async (fileEntries) => {
    setAnalyzing(true);
    setProgress('Processing files...');
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
    setExtractedFiles([]);
    setSpriteGroups({});
    setGeneratedConfig(null);
    setExportedJSON('');
    setDuplicateResults({});

    try {
      const spriteFiles = [];

      for (let i = 0; i < fileEntries.length; i++) {
        const entry = fileEntries[i];
        if (i % 10 === 0) setProgress(`Processing file ${i + 1}/${fileEntries.length}...`);

        if (isGifFile(entry.name)) {
          const dims = await loadImageDimensions(entry.blob);
          blobUrlsRef.current.push(dims.url);
          spriteFiles.push({
            path: entry.path,
            name: entry.name,
            folder: entry.folder,
            blob: entry.blob,
            url: dims.url,
            width: dims.width,
            height: dims.height,
            cols: 1, rows: 1,
            frameWidth: dims.width,
            frameHeight: dims.height,
            type: 'single_frame',
            frames: 1,
            category: classifyByFilename(entry.name),
            originalFormat: 'gif',
          });
        } else if (isSvgFile(entry.name)) {
          const text = await entry.blob.text();
          const svgBlob = new Blob([text], { type: 'image/svg+xml' });
          const dims = await loadImageDimensions(svgBlob);
          blobUrlsRef.current.push(dims.url);
          spriteFiles.push({
            path: entry.path,
            name: entry.name,
            folder: entry.folder,
            blob: svgBlob,
            url: dims.url,
            width: dims.width || 64,
            height: dims.height || 64,
            cols: 1, rows: 1,
            frameWidth: dims.width || 64,
            frameHeight: dims.height || 64,
            type: 'single_frame',
            frames: 1,
            category: classifyByFilename(entry.name),
            originalFormat: 'svg',
            isSvg: true,
          });
        } else {
          const dims = await loadImageDimensions(entry.blob);
          blobUrlsRef.current.push(dims.url);
          const layout = detectGridLayout(dims.width, dims.height);

          spriteFiles.push({
            path: entry.path,
            name: entry.name,
            folder: entry.folder,
            blob: entry.blob,
            url: dims.url,
            width: dims.width,
            height: dims.height,
            ...layout,
            frames: layout.cols * layout.rows,
            category: classifyByFilename(entry.name),
            originalFormat: entry.name.split('.').pop().toLowerCase(),
          });
        }
      }

      setExtractedFiles(spriteFiles);
      setProgress(`Processed ${spriteFiles.length} sprites. Grouping...`);

      const groups = {};
      for (const f of spriteFiles) {
        if (!groups[f.folder]) groups[f.folder] = [];
        groups[f.folder].push(f);
      }

      const individualFrameFolders = {};
      for (const [folder, files] of Object.entries(groups)) {
        if (files.length >= 3 && files.every(f => f.type === 'single_frame')) {
          const sizes = files.map(f => `${f.width}x${f.height}`);
          const uniqueSizes = new Set(sizes);
          if (uniqueSizes.size <= 2) {
            individualFrameFolders[folder] = files;
          }
        }
      }

      for (const [folder, files] of Object.entries(individualFrameFolders)) {
        setProgress(`Assembling ${files.length} frames from ${folder}...`);
        const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const urls = sorted.map(f => f.url);
        const fw = sorted[0].width;
        const fh = sorted[0].height;
        const result = await assembleFramesIntoSheet(urls, fw, fh);
        if (result) {
          blobUrlsRef.current.push(result.url);
          const animName = classifyByFilename(folder.split('/').pop()) || 'idle';
          groups[folder] = [{
            path: folder + '/_assembled.png',
            name: '_assembled.png',
            folder,
            blob: result.blob,
            url: result.url,
            width: result.width,
            height: result.height,
            cols: result.frames,
            rows: 1,
            frameWidth: fw,
            frameHeight: fh,
            type: 'horizontal_strip',
            frames: result.frames,
            category: animName,
            originalFormat: 'assembled',
            assembledFrom: sorted.map(f => f.name),
          }];
        }
      }

      setProgress('Running AI classification...');
      let aiResult = null;
      if (typeof window !== 'undefined' && window.puter) {
        try {
          const fileGroupsSummary = {};
          for (const [folder, files] of Object.entries(groups)) {
            fileGroupsSummary[folder] = files.map(f => ({ name: f.name, width: f.width, height: f.height, format: f.originalFormat }));
          }
          aiResult = await aiClassifySprites(fileGroupsSummary, async (prompt) => {
            const resp = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
            return typeof resp === 'string' ? resp : resp?.message?.content || '';
          });
        } catch (e) {
          console.warn('Puter AI not available, using filename heuristics:', e);
        }
      }

      const finalGroups = {};
      for (const [folder, files] of Object.entries(groups)) {
        const folderLower = folder.toLowerCase();
        const aiGroup = aiResult?.groups?.find(g =>
          g.folder === folder || g.folder?.toLowerCase() === folderLower
        );
        const entityName = aiGroup?.entityName || folder.split('/').pop().replace(/[-_]/g, ' ');
        const entityType = aiGroup?.entityType || 'hero';

        const animations = {};
        for (const f of files) {
          let animType = f.category;
          if (!animType && aiGroup?.animations) {
            animType = aiGroup.animations[f.name] || aiGroup.animations[f.name.toLowerCase()];
          }
          if (!animType) {
            const stem = f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[\s-]+/g, '_');
            const validKeys = Object.keys(ANIM_KEYWORDS);
            animType = validKeys.includes(stem) ? stem : stem;
          }
          let finalKey = animType;
          if (animations[finalKey]) {
            let counter = 2;
            while (animations[animType + counter]) counter++;
            finalKey = animType + counter;
          }
          animations[finalKey] = {
            src: f.url,
            frames: f.frames,
            frameWidth: f.frameWidth,
            frameHeight: f.frameHeight,
            originalFile: f.name,
            type: f.type,
            fullWidth: f.width,
            fullHeight: f.height,
            gridCols: f.cols || f.frames,
            gridRows: f.rows || 1,
            isSvg: f.isSvg || false,
            originalFormat: f.originalFormat,
            blob: f.blob,
            suggestedSpeed: suggestAnimationSpeed(finalKey),
            assembledFrom: f.assembledFrom || null,
          };
        }

        finalGroups[folder] = {
          entityName,
          entityType,
          folder,
          animations,
          frameWidth: files[0]?.frameWidth || 100,
          frameHeight: files[0]?.frameHeight || 100,
        };
      }

      setSpriteGroups(finalGroups);
      const firstKey = Object.keys(finalGroups)[0];
      if (firstKey) setSelectedGroup(firstKey);
      setProgress(`Done! ${Object.keys(finalGroups).length} groups from ${spriteFiles.length} files.`);
    } catch (err) {
      setProgress('Error: ' + err.message);
      console.error('Processing error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleZipUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress('Extracting ZIP file...');
    setAnalyzing(true);

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.entries(zip.files).filter(([name, f]) =>
        !f.dir && isImageFile(name) && !name.startsWith('__MACOSX')
      );

      setProgress(`Found ${entries.length} image files in ZIP. Extracting...`);
      const fileEntries = [];

      for (const [name, zipFile] of entries) {
        const blob = await zipFile.async('blob');
        const parts = name.split('/').filter(Boolean);
        const filename = parts[parts.length - 1];
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
        fileEntries.push({ path: name, name: filename, folder, blob });
      }

      await processFiles(fileEntries);
    } catch (err) {
      setProgress('Error extracting ZIP: ' + err.message);
      setAnalyzing(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  const handleLooseFiles = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileEntries = [];
    for (const file of files) {
      if (!isImageFile(file.name)) continue;
      const pathParts = (file.webkitRelativePath || file.name).split('/');
      const filename = pathParts[pathParts.length - 1];
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'loose_files';
      fileEntries.push({ path: file.webkitRelativePath || file.name, name: filename, folder, blob: file });
    }

    if (fileEntries.length > 0) await processFiles(fileEntries);
    if (looseFileInputRef.current) looseFileInputRef.current.value = '';
  }, [processFiles]);

  const handleImportGenerated = useCallback(async () => {
    if (!generatedImage?.url) return;
    let blob = generatedImage.blob;
    if (!blob) {
      try {
        const resp = await fetch(generatedImage.url);
        blob = await resp.blob();
      } catch (err) {
        setProgress('Failed to fetch generated image: ' + err.message);
        return;
      }
    }
    const name = `generated_${Date.now()}.png`;
    const fileEntries = [{ path: name, name, folder: 'ai_generated', blob }];
    await processFiles(fileEntries);
    setGeneratedImage(null);
  }, [generatedImage, processFiles]);

  const updateAnimCategory = useCallback((groupKey, oldAnim, newAnim) => {
    setSpriteGroups(prev => {
      const g = { ...prev };
      const group = { ...g[groupKey], animations: { ...g[groupKey].animations } };
      if (oldAnim !== newAnim && group.animations[oldAnim]) {
        group.animations[newAnim] = { ...group.animations[oldAnim], suggestedSpeed: suggestAnimationSpeed(newAnim) };
        delete group.animations[oldAnim];
      }
      g[groupKey] = group;
      return g;
    });
  }, []);

  const updateFrameCount = useCallback((groupKey, animKey, newFrames) => {
    setSpriteGroups(prev => {
      const g = { ...prev };
      const group = { ...g[groupKey], animations: { ...g[groupKey].animations } };
      group.animations[animKey] = { ...group.animations[animKey], frames: parseInt(newFrames) || 1 };
      g[groupKey] = group;
      return g;
    });
  }, []);

  const updateGridDimensions = useCallback((groupKey, animKey, cols, rows) => {
    setSpriteGroups(prev => {
      const g = { ...prev };
      const group = { ...g[groupKey], animations: { ...g[groupKey].animations } };
      const anim = group.animations[animKey];
      const newCols = parseInt(cols) || anim.gridCols;
      const newRows = parseInt(rows) || anim.gridRows;
      const fw = Math.floor(anim.fullWidth / newCols);
      const fh = Math.floor(anim.fullHeight / newRows);
      let layoutType = 'single_frame';
      if (newCols > 1 && newRows > 1) layoutType = 'grid';
      else if (newCols > 1 && newRows === 1) layoutType = 'horizontal_strip';
      else if (newCols === 1 && newRows > 1) layoutType = 'vertical_strip';
      group.animations[animKey] = {
        ...anim,
        gridCols: newCols,
        gridRows: newRows,
        frames: newCols * newRows,
        frameWidth: fw,
        frameHeight: fh,
        type: layoutType,
      };
      g[groupKey] = group;
      return g;
    });
  }, []);

  const updateEntityName = useCallback((groupKey, name) => {
    setSpriteGroups(prev => ({ ...prev, [groupKey]: { ...prev[groupKey], entityName: name } }));
  }, []);

  const updateEntityType = useCallback((groupKey, type) => {
    setSpriteGroups(prev => ({ ...prev, [groupKey]: { ...prev[groupKey], entityType: type } }));
  }, []);

  const handleRemoveBackground = useCallback(async (groupKey, animKey) => {
    const anim = spriteGroups[groupKey]?.animations[animKey];
    if (!anim?.blob) return;
    setProgress(`Removing background from ${animKey}...`);
    const result = await removeBackground(anim.blob);
    if (result.changed) {
      blobUrlsRef.current.push(result.url);
      setSpriteGroups(prev => {
        const g = { ...prev };
        const group = { ...g[groupKey], animations: { ...g[groupKey].animations } };
        group.animations[animKey] = { ...group.animations[animKey], src: result.url, blob: result.blob };
        g[groupKey] = group;
        return g;
      });
      setProgress(`Background removed from ${animKey}`);
    } else {
      setProgress('No uniform background detected');
    }
  }, [spriteGroups]);

  const handleNormalize = useCallback(async (groupKey, targetW, targetH) => {
    const group = spriteGroups[groupKey];
    if (!group) return;
    setProgress(`Normalizing frames to ${targetW}x${targetH}...`);

    setSpriteGroups(prev => {
      const g = { ...prev };
      const updated = { ...g[groupKey], animations: { ...g[groupKey].animations } };
      g[groupKey] = updated;
      return g;
    });

    for (const [animKey, anim] of Object.entries(group.animations)) {
      if (!anim.blob) continue;
      const result = await normalizeFrameSize(anim.blob, targetW * (anim.gridCols || anim.frames), targetH * (anim.gridRows || 1));
      blobUrlsRef.current.push(result.url);
      setSpriteGroups(prev => {
        const g = { ...prev };
        const grp = { ...g[groupKey], animations: { ...g[groupKey].animations } };
        grp.animations[animKey] = {
          ...grp.animations[animKey],
          src: result.url,
          blob: result.blob,
          frameWidth: targetW,
          frameHeight: targetH,
          fullWidth: result.width,
          fullHeight: result.height,
        };
        g[groupKey] = grp;
        return g;
      });
    }
    setSpriteGroups(prev => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], frameWidth: targetW, frameHeight: targetH },
    }));
    setProgress(`Normalized all frames to ${targetW}x${targetH}`);
  }, [spriteGroups]);

  const pushUndo = useCallback((label) => {
    const blobMap = {};
    for (const [folder, group] of Object.entries(spriteGroups)) {
      blobMap[folder] = {};
      for (const [animKey, anim] of Object.entries(group.animations)) {
        blobMap[folder][animKey] = { blob: anim.blob, src: anim.src };
      }
    }
    setUndoStack(prev => [...prev.slice(-9), {
      groups: JSON.parse(JSON.stringify(spriteGroups, (k, v) => k === 'blob' ? undefined : v)),
      blobMap,
      label,
      timestamp: Date.now(),
    }]);
  }, [spriteGroups]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    const restored = last.groups;
    for (const [folder, folderBlobs] of Object.entries(last.blobMap)) {
      if (!restored[folder]) continue;
      for (const [animKey, blobData] of Object.entries(folderBlobs)) {
        if (restored[folder].animations[animKey]) {
          restored[folder].animations[animKey].blob = blobData.blob;
          restored[folder].animations[animKey].src = blobData.src;
        }
      }
    }
    setSpriteGroups(restored);
    setProgress(`Undone: ${last.label}`);
  }, [undoStack]);

  const handleQuickImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isImageFile(file.name)) return;
    const fileEntries = [{ path: file.name, name: file.name, folder: 'quick_import', blob: file }];
    await processFiles(fileEntries);
    if (quickImportRef.current) quickImportRef.current.value = '';
  }, [processFiles]);

  const handleExtractPalette = useCallback(async (groupKey, animKey) => {
    const anim = spriteGroups[groupKey]?.animations[animKey];
    if (!anim?.blob) return;
    setProgress(`Extracting colors from ${animKey}...`);
    const palette = await extractColorPalette(anim.blob);
    setColorPalettes(prev => ({ ...prev, [`${groupKey}::${animKey}`]: palette }));
    setProgress(`Found ${palette.length} dominant colors`);
  }, [spriteGroups]);

  const handleAiReview = useCallback(async (groupKey) => {
    const group = spriteGroups[groupKey];
    if (!group) return;
    if (!(typeof window !== 'undefined' && window.puter)) {
      setProgress('Puter.js AI not available for review');
      return;
    }
    setAiReviewLoading(true);
    setProgress('Running AI sprite review...');
    try {
      const animSummary = Object.entries(group.animations).map(([key, anim]) => ({
        name: key,
        frames: anim.frames,
        frameWidth: anim.frameWidth,
        frameHeight: anim.frameHeight,
        fullWidth: anim.fullWidth,
        fullHeight: anim.fullHeight,
        layout: anim.type,
        gridCols: anim.gridCols,
        gridRows: anim.gridRows,
        format: anim.originalFormat,
        speed: anim.suggestedSpeed,
      }));

      const prompt = `You are a pixel art sprite sheet expert reviewing sprite data for an RPG game engine.

Entity: "${group.entityName}" (${group.entityType})
Frame target: ${group.frameWidth}x${group.frameHeight}

Animations:
${JSON.stringify(animSummary, null, 2)}

Analyze each animation and provide a JSON response with this exact format:
{
  "overall": "brief overall assessment",
  "suggestions": [
    {
      "animKey": "animation_name",
      "issue": "what's wrong",
      "fix": "what to do",
      "severity": "high|medium|low",
      "action": "adjust_frames|adjust_grid|remove_bg|change_speed|normalize|none"
    }
  ],
  "recommendedFrameSize": {"width": N, "height": N},
  "missingAnimations": ["idle", "walk"]
}

Check for: wrong frame counts (e.g., sheet 512x64 with frameWidth 64 should be 8 frames not 4), mismatched frame sizes, missing key animations (idle/walk/attack/hurt/death), unusual speeds, possible layout misdetection. Only flag real issues.`;

      const resp = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
      const text = typeof resp === 'string' ? resp : resp?.message?.content || '';
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const review = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        setAiReview({ groupKey, ...review });
        setProgress('AI review complete');
      } else {
        setAiReview({ groupKey, overall: text, suggestions: [] });
        setProgress('AI review returned non-structured response');
      }
    } catch (err) {
      setProgress('AI review failed: ' + err.message);
      setAiReview(null);
    } finally {
      setAiReviewLoading(false);
    }
  }, [spriteGroups]);

  const applyAiSuggestion = useCallback((suggestion) => {
    if (!aiReview?.groupKey) return;
    const groupKey = aiReview.groupKey;
    const animKey = suggestion.animKey;
    pushUndo('AI fix: ' + suggestion.fix);

    if (suggestion.action === 'adjust_frames' && suggestion.recommendedFrames) {
      updateFrameCount(groupKey, animKey, suggestion.recommendedFrames);
    } else if (suggestion.action === 'adjust_grid' && suggestion.recommendedCols) {
      updateGridDimensions(groupKey, animKey, suggestion.recommendedCols, suggestion.recommendedRows || 1);
    } else if (suggestion.action === 'change_speed' && suggestion.recommendedSpeed) {
      setSpriteGroups(prev => {
        const g = { ...prev };
        const group = { ...g[groupKey], animations: { ...g[groupKey].animations } };
        group.animations[animKey] = { ...group.animations[animKey], suggestedSpeed: suggestion.recommendedSpeed };
        g[groupKey] = group;
        return g;
      });
    } else if (suggestion.action === 'remove_bg') {
      handleRemoveBackground(groupKey, animKey);
    }
    setProgress(`Applied: ${suggestion.fix}`);
  }, [aiReview, pushUndo, updateFrameCount, updateGridDimensions, handleRemoveBackground]);

  const handleDownloadSheet = useCallback((groupKey, animKey) => {
    const anim = spriteGroups[groupKey]?.animations[animKey];
    if (!anim?.src) return;
    const a = document.createElement('a');
    a.href = anim.src;
    a.download = `${spriteGroups[groupKey].entityName}_${animKey}.png`;
    a.click();
  }, [spriteGroups]);

  const handleFindDuplicates = useCallback(async (groupKey, animKey) => {
    const anim = spriteGroups[groupKey]?.animations[animKey];
    if (!anim?.blob || anim.frames <= 1) return;
    setProgress(`Scanning for duplicate frames in ${animKey}...`);
    const dupes = await detectDuplicateFrames(anim.blob, anim.frameWidth, anim.frameHeight, anim.frames, 5, anim.type, anim.gridCols);
    setDuplicateResults(prev => ({ ...prev, [`${groupKey}::${animKey}`]: dupes }));
    setProgress(dupes.length > 0 ? `Found ${dupes.length} duplicate pairs in ${animKey}` : `No duplicates found in ${animKey}`);
  }, [spriteGroups]);

  const handleOpenSlicer = useCallback((groupKey, animKey) => {
    const anim = spriteGroups[groupKey]?.animations[animKey];
    if (!anim) return;
    setSlicerTarget({ groupKey, animKey });
    setSlicerCols(anim.gridCols || anim.frames || 1);
    setSlicerRows(anim.gridRows || 1);
    setViewMode('slicer');
  }, [spriteGroups]);

  const applySlice = useCallback(() => {
    if (!slicerTarget) return;
    updateGridDimensions(slicerTarget.groupKey, slicerTarget.animKey, slicerCols, slicerRows);
    setViewMode('groups');
    setProgress(`Applied ${slicerCols}x${slicerRows} slice to ${slicerTarget.animKey}`);
  }, [slicerTarget, slicerCols, slicerRows, updateGridDimensions]);

  const generateSpriteMapConfig = useCallback(() => {
    const config = {};
    for (const [folder, group] of Object.entries(spriteGroups)) {
      const id = group.entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const entry = {
        folder: folder,
        frameWidth: group.frameWidth,
        frameHeight: group.frameHeight,
        entityType: group.entityType,
      };
      for (const [animKey, anim] of Object.entries(group.animations)) {
        entry[animKey] = {
          src: `/sprites/imported/${folder}/${anim.originalFile}`,
          frames: anim.frames,
          speed: anim.suggestedSpeed || suggestAnimationSpeed(animKey),
          layout: anim.type,
        };
        if (anim.type === 'grid') {
          entry[animKey].gridCols = anim.gridCols;
          entry[animKey].gridRows = anim.gridRows;
        }
      }
      config[id] = entry;
    }
    setGeneratedConfig(config);
    const json = JSON.stringify(config, null, 2);
    setExportedJSON(json);
    return config;
  }, [spriteGroups]);

  const downloadJSON = useCallback(() => {
    if (!exportedJSON) return;
    const blob = new Blob([exportedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spriteMap_import.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportedJSON]);

  const copyJSON = useCallback(() => {
    if (!exportedJSON) return;
    navigator.clipboard.writeText(exportedJSON).catch(() => {});
  }, [exportedJSON]);

  const formatCounts = useMemo(() => {
    const counts = {};
    for (const f of extractedFiles) {
      const fmt = f.originalFormat || 'unknown';
      counts[fmt] = (counts[fmt] || 0) + 1;
    }
    return counts;
  }, [extractedFiles]);

  const currentGroup = selectedGroup ? spriteGroups[selectedGroup] : null;
  const groupKeys = Object.keys(spriteGroups);
  const slicerAnim = slicerTarget ? spriteGroups[slicerTarget.groupKey]?.animations[slicerTarget.animKey] : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🤖</span>
          <div>
            <h2 style={styles.title}>Sprite AI Worker</h2>
            <p style={styles.subtitle}>Import, splice & organize any sprite format with AI</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: puterSignedIn ? '#4ade80' : isPuterAvailable() ? '#fbbf24' : '#ef4444', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: puterSignedIn ? '#4ade80' : '#999' }}>
              {puterSignedIn ? 'Puter' : isPuterAvailable() ? 'Not signed in' : 'No SDK'}
            </span>
          </div>
          <button
            onClick={() => looseFileInputRef.current?.click()}
            style={{ ...styles.uploadBtn, background: 'linear-gradient(135deg, #4a7c59 0%, #2d6a4f 100%)' }}
            disabled={analyzing}
          >
            🖼️ Files
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.uploadBtn}
            disabled={analyzing}
          >
            {analyzing ? '⏳ Processing...' : '📦 Upload ZIP'}
          </button>
          <input ref={fileInputRef} type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
          <input ref={looseFileInputRef} type="file" accept={getSpriteFileExtensions()} onChange={handleLooseFiles} style={{ display: 'none' }} multiple />
        </div>
      </div>

      {progress && (
        <div style={styles.progressBar}>
          {analyzing && <span style={styles.spinner}>⟳</span>}
          <span>{progress}</span>
          {Object.keys(formatCounts).length > 0 && !analyzing && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>
              {Object.entries(formatCounts).map(([fmt, c]) => `${fmt.toUpperCase()}: ${c}`).join(' · ')}
            </span>
          )}
        </div>
      )}

      {groupKeys.length > 0 && (
        <div style={styles.toolbar}>
          <div style={styles.viewTabs}>
            {['groups', 'viewport', 'slicer', 'review', 'generate', 'export'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={viewMode === mode ? styles.tabActive : styles.tab}
              >
                {mode === 'groups' ? '📁 Groups' : mode === 'viewport' ? '🎬 Preview' : mode === 'slicer' ? '✂️ Slicer' : mode === 'review' ? '🤖 AI Review' : mode === 'generate' ? '✨ AI Generate' : '📄 Export'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {undoStack.length > 0 && (
              <button onClick={handleUndo} style={{ ...styles.toolBtn, color: '#fbbf24' }}>
                ↩ Undo
              </button>
            )}
            <button onClick={() => quickImportRef.current?.click()} style={styles.toolBtn}>
              ⚡ Quick Import
            </button>
            <input ref={quickImportRef} type="file" accept={getSpriteFileExtensions()} onChange={handleQuickImport} style={{ display: 'none' }} />
            <span style={styles.stats}>
              {groupKeys.length} groups · {extractedFiles.length} files
            </span>
          </div>
        </div>
      )}

      {groupKeys.length === 0 && !analyzing && viewMode !== 'generate' && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>Drop a sprite pack to get started</h3>
          <p style={styles.emptyDesc}>
            Upload a ZIP or select individual files. The AI will auto-detect characters, animations, layouts, and frame counts.
          </p>
          <button onClick={() => setViewMode('generate')} style={{ ...styles.generateBtn, marginBottom: 16 }}>
            ✨ Or Generate Sprites with AI
          </button>
          <div style={styles.formatInfo}>
            <div style={styles.formatItem}>
              <strong>Formats:</strong> PNG, GIF, SVG, WebP, JPEG, BMP
            </div>
            <div style={styles.formatItem}>
              <strong>Layouts:</strong> Horizontal strips, vertical strips, grids, individual frames
            </div>
            <div style={styles.formatItem}>
              <strong>Auto-detects:</strong> idle, walk, attack, hurt, death, block, jump, cast
            </div>
            <div style={styles.formatItem}>
              <strong>Tools:</strong> Background removal, frame normalization, duplicate detection, custom slicer
            </div>
            <div style={styles.formatItem}>
              <strong>Smart assembly:</strong> Folders of individual frames auto-assembled into sprite sheets
            </div>
          </div>
        </div>
      )}

      {viewMode === 'groups' && groupKeys.length > 0 && (
        <div style={styles.mainLayout}>
          <div style={styles.sidebar}>
            <div style={styles.sidebarTitle}>Sprite Groups</div>
            {groupKeys.map(key => {
              const g = spriteGroups[key];
              const animCount = Object.keys(g.animations).length;
              const firstAnim = Object.values(g.animations)[0];
              return (
                <div
                  key={key}
                  onClick={() => { setSelectedGroup(key); setSelectedAnim(Object.keys(g.animations)[0] || 'idle'); }}
                  style={selectedGroup === key ? styles.sidebarItemActive : styles.sidebarItem}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {firstAnim?.src && !firstAnim.isSvg && (
                      <div style={{
                        width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                        background: `url(${firstAnim.src}) no-repeat 0 0 / ${firstAnim.frameWidth <= 32 ? 'contain' : `${32}px ${32}px`}`,
                        backgroundColor: 'rgba(0,0,0,0.3)', imageRendering: 'pixelated',
                      }} />
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={styles.sidebarItemName}>{g.entityName}</div>
                      <div style={styles.sidebarItemMeta}>
                        <span style={{ ...styles.typeBadge, background: TYPE_COLORS[g.entityType] || '#4a3d6a' }}>
                          {g.entityType}
                        </span>
                        <span style={styles.animCount}>{animCount} anims</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.detailPanel}>
            {currentGroup && (
              <>
                <div style={styles.groupHeader}>
                  <div style={styles.groupHeaderLeft}>
                    <input value={currentGroup.entityName} onChange={e => updateEntityName(selectedGroup, e.target.value)} style={styles.nameInput} />
                    <select value={currentGroup.entityType} onChange={e => updateEntityType(selectedGroup, e.target.value)} style={styles.typeSelect}>
                      {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={styles.dimLabel}>Frame: {currentGroup.frameWidth}x{currentGroup.frameHeight}</span>
                    <button onClick={() => {
                      const size = prompt('Target frame size (WxH):', `${currentGroup.frameWidth}x${currentGroup.frameHeight}`);
                      if (size) {
                        const [w, h] = size.split('x').map(Number);
                        if (w > 0 && h > 0) handleNormalize(selectedGroup, w, h);
                      }
                    }} style={styles.toolBtn} title="Normalize all frames to a target size">
                      📐 Normalize
                    </button>
                  </div>
                </div>

                <div style={styles.animGrid}>
                  {Object.entries(currentGroup.animations).map(([animKey, anim]) => {
                    const dupeKey = `${selectedGroup}::${animKey}`;
                    const dupes = duplicateResults[dupeKey];
                    return (
                      <div key={animKey} style={styles.animCard}>
                        <div style={styles.animCardHeader}>
                          <select
                            value={animKey}
                            onChange={e => updateAnimCategory(selectedGroup, animKey, e.target.value)}
                            style={styles.animSelect}
                          >
                            {Object.keys(ANIM_KEYWORDS).map(k => <option key={k} value={k}>{k}</option>)}
                            <option value={animKey}>{animKey}</option>
                          </select>
                          <div style={styles.frameControl}>
                            <label style={{ fontSize: 10, color: '#999' }}>Frames:</label>
                            <input
                              type="number" value={anim.frames}
                              onChange={e => updateFrameCount(selectedGroup, animKey, e.target.value)}
                              style={styles.frameInput} min={1} max={200}
                            />
                          </div>
                        </div>

                        {(anim.type === 'grid' || anim.type === 'vertical_strip') && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 4px' }}>
                            <label style={{ fontSize: 10, color: '#999' }}>Cols:</label>
                            <input type="number" value={anim.gridCols} onChange={e => updateGridDimensions(selectedGroup, animKey, e.target.value, anim.gridRows)} style={styles.frameInput} min={1} max={60} />
                            <label style={{ fontSize: 10, color: '#999' }}>Rows:</label>
                            <input type="number" value={anim.gridRows} onChange={e => updateGridDimensions(selectedGroup, animKey, anim.gridCols, e.target.value)} style={styles.frameInput} min={1} max={60} />
                          </div>
                        )}

                        <SpritePreview
                          spriteData={{ frameWidth: anim.frameWidth, frameHeight: anim.frameHeight, [animKey]: anim }}
                          animKey={animKey}
                          scale={Math.min(2, 120 / (anim.frameWidth || 100))}
                        />

                        <div style={styles.animMeta}>
                          <span style={styles.metaText}>{anim.originalFile}</span>
                          <span style={styles.metaText}>{anim.fullWidth}x{anim.fullHeight}</span>
                          <span style={styles.metaBadge}>{LAYOUT_LABELS[anim.type] || anim.type}</span>
                          {anim.originalFormat && anim.originalFormat !== 'png' && (
                            <span style={{ ...styles.metaBadge, background: 'rgba(139,233,253,0.15)', color: '#8be9fd' }}>
                              {anim.originalFormat.toUpperCase()}
                            </span>
                          )}
                          {anim.suggestedSpeed && (
                            <span style={{ ...styles.metaBadge, color: '#b8bb26' }}>{anim.suggestedSpeed}ms</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {anim.blob && !anim.isSvg && (
                            <button onClick={() => { pushUndo('Remove BG: ' + animKey); handleRemoveBackground(selectedGroup, animKey); }} style={styles.miniToolBtn}>
                              🎨 Remove BG
                            </button>
                          )}
                          {anim.frames > 1 && anim.blob && (
                            <button onClick={() => handleFindDuplicates(selectedGroup, animKey)} style={styles.miniToolBtn}>
                              🔍 Duplicates
                            </button>
                          )}
                          <button onClick={() => handleOpenSlicer(selectedGroup, animKey)} style={styles.miniToolBtn}>
                            ✂️ Slice
                          </button>
                          {anim.blob && (
                            <button onClick={() => handleExtractPalette(selectedGroup, animKey)} style={styles.miniToolBtn}>
                              🎨 Colors
                            </button>
                          )}
                          {anim.src && (
                            <button onClick={() => handleDownloadSheet(selectedGroup, animKey)} style={styles.miniToolBtn}>
                              💾 Save
                            </button>
                          )}
                          <button onClick={() => handleAnalyzeSprite(selectedGroup, animKey)} style={styles.miniToolBtn} disabled={analyzeLoading}>
                            🔬 Analyze
                          </button>
                          {anim.blob && (
                            <button onClick={() => handleSaveToCloud(selectedGroup, animKey)} style={{ ...styles.miniToolBtn, color: '#60a5fa' }}>
                              ☁️ Cloud
                            </button>
                          )}
                        </div>

                        {analyzeResult && analyzeResult.groupKey === selectedGroup && analyzeResult.animKey === animKey && (
                          <div style={{ background: 'rgba(96,165,250,0.1)', borderRadius: 4, padding: 6, fontSize: 10, color: '#93c5fd' }}>
                            {analyzeResult.text}
                          </div>
                        )}

                        {colorPalettes[`${selectedGroup}::${animKey}`] && (
                          <div style={{ display: 'flex', gap: 2, padding: '2px 4px', flexWrap: 'wrap' }}>
                            {colorPalettes[`${selectedGroup}::${animKey}`].map((c, i) => (
                              <div key={i} title={c.hex} style={{ width: 16, height: 16, borderRadius: 2, background: c.hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                            ))}
                          </div>
                        )}

                        {dupes && dupes.length > 0 && (
                          <div style={{ background: 'rgba(250,200,50,0.1)', borderRadius: 4, padding: 6, fontSize: 10, color: '#fac832' }}>
                            {dupes.length} duplicate pair{dupes.length > 1 ? 's' : ''}: {dupes.map(d => `F${d.frameA + 1}=F${d.frameB + 1}`).join(', ')}
                          </div>
                        )}
                        {dupes && dupes.length === 0 && (
                          <div style={{ fontSize: 10, color: '#4ade80', padding: '2px 4px' }}>No duplicates found</div>
                        )}

                        {anim.assembledFrom && (
                          <div style={{ fontSize: 10, color: '#8be9fd', padding: '2px 4px' }}>
                            Assembled from {anim.assembledFrom.length} individual frames
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {viewMode === 'viewport' && groupKeys.length > 0 && (
        <div style={styles.viewportContainer}>
          <div style={styles.viewportToolbar}>
            <select
              value={selectedGroup || ''}
              onChange={e => {
                setSelectedGroup(e.target.value);
                const g = spriteGroups[e.target.value];
                if (g) setSelectedAnim(Object.keys(g.animations)[0] || 'idle');
              }}
              style={styles.viewportSelect}
            >
              {groupKeys.map(key => <option key={key} value={key}>{spriteGroups[key].entityName}</option>)}
            </select>
            {currentGroup && (
              <div style={styles.animBtns}>
                {Object.keys(currentGroup.animations).map(aKey => (
                  <button key={aKey} onClick={() => setSelectedAnim(aKey)} style={selectedAnim === aKey ? styles.animBtnActive : styles.animBtnNormal}>
                    {aKey}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowSheetOverlay(!showSheetOverlay)} style={showSheetOverlay ? styles.animBtnActive : styles.animBtnNormal}>
              {showSheetOverlay ? '🎬 Animation' : '🗺️ Full Sheet'}
            </button>
          </div>

          <div style={styles.viewport}>
            {showSheetOverlay && currentGroup?.animations[selectedAnim]?.src ? (
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', overflow: 'auto' }}>
                <img src={currentGroup.animations[selectedAnim].src} alt="full sheet" style={{ maxWidth: '100%', maxHeight: 500, imageRendering: 'pixelated', display: 'block' }} />
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {(() => {
                    const anim = currentGroup.animations[selectedAnim];
                    const cols = anim.gridCols || anim.frames || 1;
                    const rows = anim.gridRows || 1;
                    const lines = [];
                    for (let i = 1; i < cols; i++) {
                      lines.push(<line key={`vc${i}`} x1={`${(i / cols) * 100}%`} y1="0" x2={`${(i / cols) * 100}%`} y2="100%" stroke="rgba(224,201,127,0.5)" strokeWidth="1" strokeDasharray="3,3" />);
                    }
                    for (let i = 1; i < rows; i++) {
                      lines.push(<line key={`hr${i}`} x1="0" y1={`${(i / rows) * 100}%`} x2="100%" y2={`${(i / rows) * 100}%`} stroke="rgba(224,201,127,0.5)" strokeWidth="1" strokeDasharray="3,3" />);
                    }
                    return lines;
                  })()}
                </svg>
              </div>
            ) : (
              <div style={styles.viewportBg}>
                {currentGroup && currentGroup.animations[selectedAnim] && (
                  <SpritePreview
                    spriteData={{ frameWidth: currentGroup.animations[selectedAnim].frameWidth, frameHeight: currentGroup.animations[selectedAnim].frameHeight, [selectedAnim]: currentGroup.animations[selectedAnim] }}
                    animKey={selectedAnim}
                    scale={Math.min(4, 280 / Math.max(currentGroup.animations[selectedAnim]?.frameWidth || 100, currentGroup.animations[selectedAnim]?.frameHeight || 100))}
                    squareViewport
                    showZoom
                  />
                )}
              </div>
            )}

            {currentGroup && (
              <div style={styles.viewportInfo}>
                <div><strong>{currentGroup.entityName}</strong> — {selectedAnim}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {currentGroup.animations[selectedAnim]?.frames} frames ·{' '}
                  {currentGroup.animations[selectedAnim]?.frameWidth}x{currentGroup.animations[selectedAnim]?.frameHeight}px ·{' '}
                  {LAYOUT_LABELS[currentGroup.animations[selectedAnim]?.type] || currentGroup.animations[selectedAnim]?.type}
                  {currentGroup.animations[selectedAnim]?.originalFormat && ` · ${currentGroup.animations[selectedAnim].originalFormat.toUpperCase()}`}
                  {currentGroup.animations[selectedAnim]?.suggestedSpeed && ` · ${currentGroup.animations[selectedAnim].suggestedSpeed}ms`}
                </div>
              </div>
            )}
          </div>

          {currentGroup && !showSheetOverlay && (
            <div style={styles.stripPreview}>
              <div style={styles.stripLabel}>Full Sheet</div>
              <div style={styles.stripContainer}>
                <img src={currentGroup.animations[selectedAnim]?.src} alt="sprite sheet" style={styles.stripImage} />
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'review' && groupKeys.length > 0 && (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedGroup || ''}
              onChange={e => setSelectedGroup(e.target.value)}
              style={styles.viewportSelect}
            >
              {groupKeys.map(key => <option key={key} value={key}>{spriteGroups[key].entityName}</option>)}
            </select>
            <button
              onClick={() => selectedGroup && handleAiReview(selectedGroup)}
              disabled={aiReviewLoading || !selectedGroup}
              style={styles.generateBtn}
            >
              {aiReviewLoading ? '⏳ Analyzing...' : '🤖 Run AI Review'}
            </button>
            {currentGroup && (
              <span style={{ fontSize: 12, color: '#888' }}>
                {Object.keys(currentGroup.animations).length} animations · {currentGroup.entityType}
              </span>
            )}
          </div>

          {aiReview && aiReview.groupKey === selectedGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#e0c97f', fontFamily: 'Cinzel, serif', fontSize: 14, marginBottom: 8 }}>Overall Assessment</div>
                <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.5 }}>{aiReview.overall}</div>
              </div>

              {aiReview.missingAnimations?.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12 }}>
                  <div style={{ color: '#f87171', fontSize: 12, marginBottom: 4 }}>Missing Animations</div>
                  <div style={{ color: '#fca5a5', fontSize: 13 }}>{aiReview.missingAnimations.join(', ')}</div>
                </div>
              )}

              {aiReview.recommendedFrameSize && (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: 12 }}>
                  <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 4 }}>Recommended Frame Size</div>
                  <div style={{ color: '#93c5fd', fontSize: 13 }}>{aiReview.recommendedFrameSize.width}x{aiReview.recommendedFrameSize.height}px</div>
                </div>
              )}

              {aiReview.suggestions?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: '#e0c97f', fontFamily: 'Cinzel, serif', fontSize: 14 }}>Suggestions</div>
                  {aiReview.suggestions.map((s, i) => (
                    <div key={i} style={{
                      background: s.severity === 'high' ? 'rgba(239,68,68,0.08)' : s.severity === 'medium' ? 'rgba(251,191,36,0.08)' : 'rgba(74,222,128,0.08)',
                      border: `1px solid ${s.severity === 'high' ? 'rgba(239,68,68,0.3)' : s.severity === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)'}`,
                      borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#eee' }}>{s.animKey}</span>
                          <span style={{
                            fontSize: 10, padding: '1px 6px', borderRadius: 4,
                            background: s.severity === 'high' ? 'rgba(239,68,68,0.3)' : s.severity === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)',
                            color: s.severity === 'high' ? '#f87171' : s.severity === 'medium' ? '#fbbf24' : '#4ade80',
                          }}>{s.severity}</span>
                        </div>
                        <div style={{ color: '#eee', fontSize: 13, marginBottom: 2 }}>{s.issue}</div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>{s.fix}</div>
                      </div>
                      {s.action && s.action !== 'none' && (
                        <button onClick={() => applyAiSuggestion(s)} style={{ ...styles.miniToolBtn, color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }}>
                          Apply Fix
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {aiReview.suggestions?.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, color: '#4ade80', fontSize: 14 }}>
                  No issues found! Your sprite setup looks good.
                </div>
              )}
            </div>
          )}

          {!aiReview && !aiReviewLoading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 14 }}>
              <p>Select a sprite group and click "Run AI Review" to get AI-powered analysis of your sprite sheets.</p>
              <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                The AI checks frame counts, layout detection, missing animations, speed settings, and suggests fixes.
              </p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'slicer' && (
        <div style={{ padding: 20 }}>
          {slicerAnim ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, color: '#e0c97f', fontFamily: 'Cinzel, serif', fontSize: 16 }}>
                  Custom Slicer — {slicerTarget.animKey}
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: '#ccc' }}>Columns:</label>
                  <input type="number" value={slicerCols} onChange={e => setSlicerCols(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...styles.frameInput, width: 56 }} min={1} max={60} />
                  <label style={{ fontSize: 12, color: '#ccc' }}>Rows:</label>
                  <input type="number" value={slicerRows} onChange={e => setSlicerRows(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...styles.frameInput, width: 56 }} min={1} max={60} />
                  <span style={{ fontSize: 12, color: '#888' }}>
                    = {slicerCols * slicerRows} frames ({Math.floor(slicerAnim.fullWidth / slicerCols)}x{Math.floor(slicerAnim.fullHeight / slicerRows)}px each)
                  </span>
                </div>
                <button onClick={applySlice} style={styles.generateBtn}>Apply Slice</button>
                <button onClick={() => setViewMode('groups')} style={styles.copyBtn}>Cancel</button>
              </div>

              <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'center' }}>
                <img src={slicerAnim.src} alt="slice target" style={{ maxWidth: '100%', maxHeight: 400, imageRendering: 'pixelated', display: 'block' }} />
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {Array.from({ length: slicerCols - 1 }, (_, i) => (
                    <line key={`c${i}`} x1={`${((i + 1) / slicerCols) * 100}%`} y1="0" x2={`${((i + 1) / slicerCols) * 100}%`} y2="100%" stroke="rgba(224,201,127,0.6)" strokeWidth="1" strokeDasharray="4,4" />
                  ))}
                  {Array.from({ length: slicerRows - 1 }, (_, i) => (
                    <line key={`r${i}`} x1="0" y1={`${((i + 1) / slicerRows) * 100}%`} x2="100%" y2={`${((i + 1) / slicerRows) * 100}%`} stroke="rgba(224,201,127,0.6)" strokeWidth="1" strokeDasharray="4,4" />
                  ))}
                </svg>
              </div>

              <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                Sheet: {slicerAnim.fullWidth}x{slicerAnim.fullHeight}px · Frame: {Math.floor(slicerAnim.fullWidth / slicerCols)}x{Math.floor(slicerAnim.fullHeight / slicerRows)}px
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>
              <p>Select a sprite from the Groups view and click the ✂️ Slice button to open the custom slicer.</p>
              <button onClick={() => setViewMode('groups')} style={styles.copyBtn}>Go to Groups</button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'generate' && (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
            <h3 style={{ margin: 0, color: '#e0c97f', fontFamily: 'Cinzel, serif', fontSize: 16 }}>
              Generate Sprite from Text
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
              Describe the sprite you want to create and AI will generate it for you.
            </p>
            <textarea
              value={generatePrompt}
              onChange={e => setGeneratePrompt(e.target.value)}
              placeholder="e.g., pixel art warrior character idle animation sprite sheet, 4 frames, transparent background, 64x64"
              style={{
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: '#eee', padding: 12, fontSize: 13,
                minHeight: 80, resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleGenerateSprite}
                disabled={generateLoading || !generatePrompt.trim()}
                style={{
                  ...styles.generateBtn,
                  opacity: generateLoading || !generatePrompt.trim() ? 0.5 : 1,
                }}
              >
                {generateLoading ? '⏳ Generating...' : '✨ Generate Sprite'}
              </button>
            </div>
          </div>

          {generatedImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', padding: 20, display: 'inline-block' }}>
                <img
                  src={generatedImage.url}
                  alt="Generated sprite"
                  style={{ maxWidth: 400, maxHeight: 400, imageRendering: 'pixelated', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                Prompt: "{generatedImage.prompt}"
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleImportGenerated} style={styles.generateBtn}>
                  📥 Import to Workspace
                </button>
                <button onClick={() => setGeneratedImage(null)} style={styles.copyBtn}>
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!generatedImage && !generateLoading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>✨</div>
              <p style={{ fontSize: 13 }}>Enter a prompt above to generate a sprite using AI image generation.</p>
              <p style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                Tip: Include "pixel art", "sprite sheet", frame count, and "transparent background" for best results.
              </p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'export' && groupKeys.length > 0 && (
        <div style={styles.exportContainer}>
          <div style={styles.exportHeader}>
            <button onClick={generateSpriteMapConfig} style={styles.generateBtn}>
              ⚙️ Generate spriteMap Config
            </button>
            {exportedJSON && (
              <>
                <button onClick={copyJSON} style={styles.copyBtn}>📋 Copy JSON</button>
                <button onClick={downloadJSON} style={styles.downloadBtn}>💾 Download</button>
                <button onClick={handleExportAllToCloud} style={{ ...styles.downloadBtn, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} disabled={cloudSaveStatus === 'saving'}>
                  {cloudSaveStatus === 'saving' ? '⏳ Saving...' : '☁️ Export to Puter'}
                </button>
              </>
            )}
          </div>

          {exportedJSON && (
            <pre style={styles.jsonPreview}>{exportedJSON}</pre>
          )}

          {!exportedJSON && (
            <div style={styles.exportEmpty}>
              <p>Click "Generate spriteMap Config" to create a JSON config compatible with the game's SpriteAnimation system.</p>
              <p style={{ fontSize: 12, color: '#777', marginTop: 8 }}>
                Includes layout type, suggested animation speeds, and grid dimensions.
                Paths assume sprites at <code style={{ color: '#8be9fd' }}>/sprites/imported/[folder]/</code>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0d1117 100%)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    minHeight: 500,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: { fontSize: 28 },
  title: { margin: 0, fontSize: 18, fontFamily: 'Cinzel, serif', color: '#e0c97f' },
  subtitle: { margin: 0, fontSize: 12, color: '#999' },
  headerRight: { display: 'flex', gap: 8 },
  uploadBtn: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #d4a843 0%, #b8860b 100%)',
    border: 'none', borderRadius: 8, color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: 14,
  },
  progressBar: {
    padding: '10px 20px', background: 'rgba(212,168,67,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e0c97f',
    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
  },
  spinner: { display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 16 },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  viewTabs: { display: 'flex', gap: 4 },
  tab: {
    padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
    color: '#ccc', cursor: 'pointer', fontSize: 12,
  },
  tabActive: {
    padding: '6px 14px', background: 'rgba(212,168,67,0.2)',
    border: '1px solid rgba(212,168,67,0.4)', borderRadius: 6,
    color: '#e0c97f', cursor: 'pointer', fontSize: 12, fontWeight: 'bold',
  },
  stats: { color: '#888', fontSize: 12 },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 60, textAlign: 'center',
  },
  emptyIcon: { fontSize: 64, marginBottom: 16, opacity: 0.6 },
  emptyTitle: { color: '#e0c97f', fontFamily: 'Cinzel, serif', fontSize: 20, margin: '0 0 8px' },
  emptyDesc: { color: '#999', fontSize: 14, maxWidth: 500, margin: '0 0 24px' },
  formatInfo: {
    display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left',
    background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  formatItem: { color: '#bbb', fontSize: 12 },
  mainLayout: { display: 'flex', height: 500, overflow: 'hidden' },
  sidebar: { width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: 'rgba(0,0,0,0.15)' },
  sidebarTitle: {
    padding: '10px 14px', fontSize: 11, fontWeight: 'bold', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  sidebarItem: {
    padding: '10px 14px', cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s',
  },
  sidebarItemActive: {
    padding: '10px 14px', cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    background: 'rgba(212,168,67,0.12)', borderLeft: '3px solid #e0c97f',
  },
  sidebarItemName: { fontSize: 13, color: '#eee', marginBottom: 4 },
  sidebarItemMeta: { display: 'flex', gap: 6, alignItems: 'center' },
  typeBadge: { fontSize: 10, padding: '1px 6px', borderRadius: 4, color: '#eee' },
  animCount: { fontSize: 10, color: '#888' },
  detailPanel: { flex: 1, overflowY: 'auto', padding: 16 },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexWrap: 'wrap', gap: 8,
  },
  groupHeaderLeft: { display: 'flex', gap: 8, alignItems: 'center' },
  nameInput: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6, color: '#eee', padding: '6px 10px', fontSize: 14,
    fontFamily: 'Cinzel, serif', width: 200,
  },
  typeSelect: {
    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6, color: '#eee', padding: '6px 10px', fontSize: 12,
  },
  dimLabel: { fontSize: 12, color: '#888' },
  toolBtn: {
    padding: '4px 10px', background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
    color: '#ccc', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap',
  },
  miniToolBtn: {
    padding: '2px 8px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
    color: '#aaa', cursor: 'pointer', fontSize: 10,
  },
  animGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  animCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
  },
  animCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  animSelect: {
    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 4, color: '#eee', padding: '4px 8px', fontSize: 12, flex: 1,
  },
  frameControl: { display: 'flex', alignItems: 'center', gap: 4 },
  frameInput: {
    width: 44, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 4, color: '#eee', padding: '3px 6px', fontSize: 12, textAlign: 'center',
  },
  animMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaText: { fontSize: 10, color: '#777' },
  metaBadge: {
    fontSize: 9, padding: '1px 5px', borderRadius: 3,
    background: 'rgba(255,255,255,0.06)', color: '#aaa',
  },
  viewportContainer: { padding: 16, display: 'flex', flexDirection: 'column', gap: 16 },
  viewportToolbar: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  viewportSelect: {
    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6, color: '#eee', padding: '6px 12px', fontSize: 13,
  },
  animBtns: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  animBtnNormal: {
    padding: '4px 10px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
    color: '#ccc', cursor: 'pointer', fontSize: 11,
  },
  animBtnActive: {
    padding: '4px 10px', background: 'rgba(212,168,67,0.2)',
    border: '1px solid rgba(212,168,67,0.4)', borderRadius: 4,
    color: '#e0c97f', cursor: 'pointer', fontSize: 11, fontWeight: 'bold',
  },
  viewport: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  viewportBg: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
    padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: 320, minWidth: 320, aspectRatio: '1', maxWidth: 500, margin: '0 auto',
  },
  viewportInfo: { textAlign: 'center', color: '#eee', fontSize: 14 },
  stripPreview: {
    background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  stripLabel: { fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  stripContainer: { overflowX: 'auto', padding: 4 },
  stripImage: { maxHeight: 120, imageRendering: 'pixelated' },
  exportContainer: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  exportHeader: { display: 'flex', gap: 10, alignItems: 'center' },
  generateBtn: {
    padding: '8px 16px', background: 'linear-gradient(135deg, #d4a843 0%, #b8860b 100%)',
    border: 'none', borderRadius: 8, color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: 13,
  },
  copyBtn: {
    padding: '8px 14px', background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
    color: '#eee', cursor: 'pointer', fontSize: 13,
  },
  downloadBtn: {
    padding: '8px 14px', background: 'rgba(45,106,79,0.3)',
    border: '1px solid rgba(45,106,79,0.5)', borderRadius: 8,
    color: '#9be0b8', cursor: 'pointer', fontSize: 13,
  },
  jsonPreview: {
    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: 16, color: '#8be9fd', fontSize: 12,
    fontFamily: 'monospace', overflowX: 'auto', maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre',
  },
  exportEmpty: { color: '#888', fontSize: 14, padding: 40, textAlign: 'center' },
};
