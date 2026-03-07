import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
  isImageFile, isGifFile, isSvgFile, getSpriteFileExtensions,
  loadImageDimensions, detectGridLayout,
  assembleFramesIntoSheet, removeBackground, normalizeFrameSize,
  detectDuplicateFrames, suggestAnimationSpeed,
} from '../utils/spriteProcessing.js';

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

function SpritePreview({ spriteData, animKey, scale = 2 }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(() => suggestAnimationSpeed(animKey));
  const intervalRef = useRef(null);

  const anim = spriteData?.[animKey];
  const totalFrames = anim?.frames || 1;
  const frameWidth = anim?.frameWidth || spriteData?.frameWidth || 100;
  const frameHeight = anim?.frameHeight || spriteData?.frameHeight || 100;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;
  const isVertical = anim?.type === 'vertical_strip';
  const isGrid = anim?.type === 'grid';
  const gridCols = anim?.gridCols || totalFrames;

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

  if (!anim) return <div style={{ color: '#999', padding: 8 }}>No animation data</div>;

  let bgPosX = 0, bgPosY = 0, bgSizeW, bgSizeH;
  if (isGrid) {
    const col = frame % gridCols;
    const row = Math.floor(frame / gridCols);
    bgPosX = -col * displayWidth;
    bgPosY = -row * displayHeight;
    const gridRows = Math.ceil(totalFrames / gridCols);
    bgSizeW = gridCols * displayWidth;
    bgSizeH = gridRows * displayHeight;
  } else if (isVertical) {
    bgPosX = 0;
    bgPosY = -frame * displayHeight;
    bgSizeW = displayWidth;
    bgSizeH = totalFrames * displayHeight;
  } else {
    bgPosX = -frame * displayWidth;
    bgPosY = 0;
    bgSizeW = totalFrames * displayWidth;
    bgSizeH = displayHeight;
  }

  const isSvg = anim.src && (anim.src.includes('.svg') || anim.isSvg);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {isSvg ? (
        <img src={anim.src} alt="svg sprite" style={{
          width: displayWidth, height: displayHeight, imageRendering: 'auto',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.3)',
        }} />
      ) : (
        <div style={{
          width: displayWidth, height: displayHeight,
          imageRendering: 'pixelated',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          background: `url(${anim.src}) no-repeat ${bgPosX}px ${bgPosY}px / ${bgSizeW}px ${bgSizeH}px`,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }} />
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
      </div>
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
  const fileInputRef = useRef(null);
  const looseFileInputRef = useRef(null);
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

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
            {['groups', 'viewport', 'slicer', 'export'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={viewMode === mode ? styles.tabActive : styles.tab}
              >
                {mode === 'groups' ? '📁 Groups' : mode === 'viewport' ? '🎬 Preview' : mode === 'slicer' ? '✂️ Slicer' : '📄 Export'}
              </button>
            ))}
          </div>
          <span style={styles.stats}>
            {groupKeys.length} groups · {extractedFiles.length} files
          </span>
        </div>
      )}

      {groupKeys.length === 0 && !analyzing && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>Drop a sprite pack to get started</h3>
          <p style={styles.emptyDesc}>
            Upload a ZIP or select individual files. The AI will auto-detect characters, animations, layouts, and frame counts.
          </p>
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
              return (
                <div
                  key={key}
                  onClick={() => { setSelectedGroup(key); setSelectedAnim(Object.keys(g.animations)[0] || 'idle'); }}
                  style={selectedGroup === key ? styles.sidebarItemActive : styles.sidebarItem}
                >
                  <div style={styles.sidebarItemName}>{g.entityName}</div>
                  <div style={styles.sidebarItemMeta}>
                    <span style={{ ...styles.typeBadge, background: TYPE_COLORS[g.entityType] || '#4a3d6a' }}>
                      {g.entityType}
                    </span>
                    <span style={styles.animCount}>{animCount} anims</span>
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
                            <button onClick={() => handleRemoveBackground(selectedGroup, animKey)} style={styles.miniToolBtn}>
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
                        </div>

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
          </div>

          <div style={styles.viewport}>
            <div style={styles.viewportBg}>
              {currentGroup && currentGroup.animations[selectedAnim] && (
                <SpritePreview
                  spriteData={{ frameWidth: currentGroup.animations[selectedAnim].frameWidth, frameHeight: currentGroup.animations[selectedAnim].frameHeight, [selectedAnim]: currentGroup.animations[selectedAnim] }}
                  animKey={selectedAnim}
                  scale={Math.min(4, 240 / (currentGroup.animations[selectedAnim]?.frameWidth || 100))}
                />
              )}
            </div>

            {currentGroup && (
              <div style={styles.viewportInfo}>
                <div><strong>{currentGroup.entityName}</strong> — {selectedAnim}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {currentGroup.animations[selectedAnim]?.frames} frames ·
                  {currentGroup.animations[selectedAnim]?.frameWidth}x{currentGroup.animations[selectedAnim]?.frameHeight}px ·
                  {LAYOUT_LABELS[currentGroup.animations[selectedAnim]?.type] || currentGroup.animations[selectedAnim]?.type}
                  {currentGroup.animations[selectedAnim]?.originalFormat && ` · ${currentGroup.animations[selectedAnim].originalFormat.toUpperCase()}`}
                  {currentGroup.animations[selectedAnim]?.suggestedSpeed && ` · ${currentGroup.animations[selectedAnim].suggestedSpeed}ms`}
                </div>
              </div>
            )}
          </div>

          {currentGroup && (
            <div style={styles.stripPreview}>
              <div style={styles.stripLabel}>Full Sheet</div>
              <div style={styles.stripContainer}>
                <img src={currentGroup.animations[selectedAnim]?.src} alt="sprite sheet" style={styles.stripImage} />
              </div>
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
    background: 'repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px',
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
    padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: 200, width: '100%',
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
