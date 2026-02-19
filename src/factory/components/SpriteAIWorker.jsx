import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';

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

async function loadImageDimensions(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    };
    img.onerror = () => resolve({ width: 0, height: 0, url });
    img.src = url;
  });
}

function detectFrameCount(width, height) {
  if (width <= 0 || height <= 0) return { frames: 1, frameWidth: width, frameHeight: height, type: 'single' };

  if (width > height * 1.5) {
    const possibleSizes = [16, 32, 48, 64, 80, 96, 100, 128, 135, 162, 192, 256];
    for (const size of possibleSizes) {
      if (width % size === 0 && Math.abs(height - size) < size * 0.3) {
        const frames = Math.round(width / size);
        if (frames >= 2 && frames <= 40) {
          return { frames, frameWidth: size, frameHeight: height, type: 'horizontal_strip' };
        }
      }
    }
    if (width % height === 0) {
      const frames = Math.round(width / height);
      if (frames >= 2 && frames <= 40) {
        return { frames, frameWidth: height, frameHeight: height, type: 'horizontal_strip' };
      }
    }
    const guessFrameW = height;
    const guessFrames = Math.round(width / guessFrameW);
    if (guessFrames >= 2 && guessFrames <= 40 && Math.abs(width - guessFrames * guessFrameW) < 4) {
      return { frames: guessFrames, frameWidth: guessFrameW, frameHeight: height, type: 'horizontal_strip' };
    }
  }

  if (width > height * 0.8 && width < height * 1.2) {
    return { frames: 1, frameWidth: width, frameHeight: height, type: 'single_frame' };
  }

  const ratio = width / height;
  const guessFrames = Math.max(1, Math.round(ratio));
  const fw = Math.round(width / guessFrames);
  return { frames: guessFrames, frameWidth: fw, frameHeight: height, type: guessFrames > 1 ? 'horizontal_strip' : 'single_frame' };
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
  const [speed, setSpeed] = useState(120);
  const intervalRef = useRef(null);

  const anim = spriteData?.[animKey];
  const totalFrames = anim?.frames || 1;
  const frameWidth = anim?.frameWidth || spriteData?.frameWidth || 100;
  const frameHeight = anim?.frameHeight || spriteData?.frameHeight || 100;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: displayWidth,
        height: displayHeight,
        backgroundImage: `url(${anim.src})`,
        backgroundSize: `${totalFrames * displayWidth}px ${displayHeight}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${frame * displayWidth}px 0`,
        imageRendering: 'pixelated',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        background: `url(${anim.src}) no-repeat -${frame * displayWidth}px 0 / ${totalFrames * displayWidth}px ${displayHeight}px`,
        backgroundColor: 'rgba(0,0,0,0.3)',
      }} />
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
          <option value={60}>Fast</option>
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
  const fileInputRef = useRef(null);
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  const handleZipUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setProgress('Extracting ZIP file...');
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
    setExtractedFiles([]);
    setSpriteGroups({});
    setGeneratedConfig(null);
    setExportedJSON('');

    try {
      const zip = await JSZip.loadAsync(file);
      const pngFiles = [];
      const entries = Object.entries(zip.files).filter(([name, f]) =>
        !f.dir && /\.(png|webp)$/i.test(name) && !name.startsWith('__MACOSX')
      );

      setProgress(`Found ${entries.length} image files. Loading...`);

      for (let i = 0; i < entries.length; i++) {
        const [name, zipFile] = entries[i];
        if (i % 10 === 0) setProgress(`Loading file ${i + 1}/${entries.length}...`);
        const blob = await zipFile.async('blob');
        const dims = await loadImageDimensions(blob);
        blobUrlsRef.current.push(dims.url);
        const parts = name.split('/').filter(Boolean);
        const filename = parts[parts.length - 1];
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
        const detection = detectFrameCount(dims.width, dims.height);

        pngFiles.push({
          path: name,
          name: filename,
          folder,
          blob,
          url: dims.url,
          width: dims.width,
          height: dims.height,
          ...detection,
          category: classifyByFilename(filename),
        });
      }

      setExtractedFiles(pngFiles);
      setProgress(`Extracted ${pngFiles.length} sprites. Grouping by folder...`);

      const groups = {};
      for (const f of pngFiles) {
        if (!groups[f.folder]) groups[f.folder] = [];
        groups[f.folder].push(f);
      }

      setProgress('Running AI classification...');
      let aiResult = null;
      if (typeof window !== 'undefined' && window.puter) {
        try {
          const fileGroupsSummary = {};
          for (const [folder, files] of Object.entries(groups)) {
            fileGroupsSummary[folder] = files.map(f => ({ name: f.name, width: f.width, height: f.height }));
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
          };
        }

        finalGroups[folder] = {
          entityName,
          entityType,
          folder,
          animations,
          frameWidth: files[0]?.frameHeight || 100,
          frameHeight: files[0]?.frameHeight || 100,
        };
      }

      setSpriteGroups(finalGroups);
      const firstKey = Object.keys(finalGroups)[0];
      if (firstKey) setSelectedGroup(firstKey);
      setProgress(`Done! ${Object.keys(finalGroups).length} sprite groups classified.`);
    } catch (err) {
      setProgress('Error: ' + err.message);
      console.error('ZIP extraction error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const updateAnimCategory = useCallback((groupKey, oldAnim, newAnim) => {
    setSpriteGroups(prev => {
      const g = { ...prev };
      const group = { ...g[groupKey], animations: { ...g[groupKey].animations } };
      if (oldAnim !== newAnim && group.animations[oldAnim]) {
        group.animations[newAnim] = group.animations[oldAnim];
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

  const updateEntityName = useCallback((groupKey, name) => {
    setSpriteGroups(prev => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], entityName: name },
    }));
  }, []);

  const updateEntityType = useCallback((groupKey, type) => {
    setSpriteGroups(prev => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], entityType: type },
    }));
  }, []);

  const generateSpriteMapConfig = useCallback(() => {
    const config = {};
    for (const [folder, group] of Object.entries(spriteGroups)) {
      const id = group.entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const entry = {
        folder: folder,
        frameWidth: group.frameWidth,
        frameHeight: group.frameHeight,
      };
      for (const [animKey, anim] of Object.entries(group.animations)) {
        entry[animKey] = {
          src: `/sprites/imported/${folder}/${anim.originalFile}`,
          frames: anim.frames,
        };
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

  const currentGroup = selectedGroup ? spriteGroups[selectedGroup] : null;
  const groupKeys = Object.keys(spriteGroups);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🤖</span>
          <div>
            <h2 style={styles.title}>Sprite AI Worker</h2>
            <p style={styles.subtitle}>Import, analyze & organize sprite packs with AI</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.uploadBtn}
            disabled={analyzing}
          >
            {analyzing ? '⏳ Analyzing...' : '📦 Upload ZIP'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleZipUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {progress && (
        <div style={styles.progressBar}>
          {analyzing && <span style={styles.spinner}>⟳</span>}
          <span>{progress}</span>
        </div>
      )}

      {groupKeys.length > 0 && (
        <div style={styles.toolbar}>
          <div style={styles.viewTabs}>
            {['groups', 'viewport', 'export'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={viewMode === mode ? styles.tabActive : styles.tab}
              >
                {mode === 'groups' ? '📁 Groups' : mode === 'viewport' ? '🎬 Preview' : '📄 Export'}
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
          <h3 style={styles.emptyTitle}>Drop a sprite pack ZIP to get started</h3>
          <p style={styles.emptyDesc}>
            Upload a ZIP containing sprite sheets (horizontal strips of animation frames).
            The AI will auto-detect characters, animations, and frame counts.
          </p>
          <div style={styles.formatInfo}>
            <div style={styles.formatItem}>
              <strong>Supported:</strong> PNG sprite sheets (horizontal strips)
            </div>
            <div style={styles.formatItem}>
              <strong>Auto-detects:</strong> idle, walk, attack, hurt, death, block, jump, cast
            </div>
            <div style={styles.formatItem}>
              <strong>Organize by:</strong> Folders = character groups, files = animation types
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
                    <span style={{
                      ...styles.typeBadge,
                      background: { hero: '#2d6a4f', enemy: '#6a2d2d', npc: '#4a3d6a', effect: '#6a5a2d', building: '#2d4a6a', terrain: '#3a6a3a', vehicle: '#5a3a6a', icon: '#6a4a2d' }[g.entityType] || '#4a3d6a',
                    }}>
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
                    <input
                      value={currentGroup.entityName}
                      onChange={e => updateEntityName(selectedGroup, e.target.value)}
                      style={styles.nameInput}
                    />
                    <select
                      value={currentGroup.entityType}
                      onChange={e => updateEntityType(selectedGroup, e.target.value)}
                      style={styles.typeSelect}
                    >
                      <option value="hero">Hero</option>
                      <option value="enemy">Enemy</option>
                      <option value="npc">NPC</option>
                      <option value="effect">Effect</option>
                      <option value="building">Building</option>
                      <option value="terrain">Terrain</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="icon">Icon</option>
                    </select>
                  </div>
                  <div style={styles.groupHeaderRight}>
                    <span style={styles.dimLabel}>Frame: {currentGroup.frameWidth}×{currentGroup.frameHeight}</span>
                  </div>
                </div>

                <div style={styles.animGrid}>
                  {Object.entries(currentGroup.animations).map(([animKey, anim]) => (
                    <div key={animKey} style={styles.animCard}>
                      <div style={styles.animCardHeader}>
                        <select
                          value={animKey}
                          onChange={e => updateAnimCategory(selectedGroup, animKey, e.target.value)}
                          style={styles.animSelect}
                        >
                          {Object.keys(ANIM_KEYWORDS).map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                        <div style={styles.frameControl}>
                          <label style={{ fontSize: 10, color: '#999' }}>Frames:</label>
                          <input
                            type="number"
                            value={anim.frames}
                            onChange={e => updateFrameCount(selectedGroup, animKey, e.target.value)}
                            style={styles.frameInput}
                            min={1}
                            max={40}
                          />
                        </div>
                      </div>

                      <SpritePreview
                        spriteData={{
                          frameWidth: anim.frameWidth,
                          frameHeight: anim.frameHeight,
                          [animKey]: anim,
                        }}
                        animKey={animKey}
                        scale={Math.min(2, 120 / (anim.frameWidth || 100))}
                      />

                      <div style={styles.animMeta}>
                        <span style={styles.metaText}>{anim.originalFile}</span>
                        <span style={styles.metaText}>{anim.fullWidth}×{anim.fullHeight}</span>
                        <span style={styles.metaBadge}>{anim.type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
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
              {groupKeys.map(key => (
                <option key={key} value={key}>{spriteGroups[key].entityName}</option>
              ))}
            </select>
            {currentGroup && (
              <div style={styles.animBtns}>
                {Object.keys(currentGroup.animations).map(aKey => (
                  <button
                    key={aKey}
                    onClick={() => setSelectedAnim(aKey)}
                    style={selectedAnim === aKey ? styles.animBtnActive : styles.animBtnNormal}
                  >
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
                  spriteData={{
                    frameWidth: currentGroup.animations[selectedAnim].frameWidth,
                    frameHeight: currentGroup.animations[selectedAnim].frameHeight,
                    [selectedAnim]: currentGroup.animations[selectedAnim],
                  }}
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
                  {currentGroup.animations[selectedAnim]?.frameWidth}×{currentGroup.animations[selectedAnim]?.frameHeight}px ·
                  {currentGroup.animations[selectedAnim]?.type}
                </div>
              </div>
            )}
          </div>

          {currentGroup && (
            <div style={styles.stripPreview}>
              <div style={styles.stripLabel}>Full Sheet</div>
              <div style={styles.stripContainer}>
                <img
                  src={currentGroup.animations[selectedAnim]?.src}
                  alt="sprite sheet"
                  style={styles.stripImage}
                />
              </div>
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
                The exported paths assume sprites are placed in <code style={{ color: '#8be9fd' }}>/sprites/imported/[folder]/</code>.
                Copy the sprite files from your ZIP to that location, then paste the config into spriteMap.js.
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    fontSize: 28,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontFamily: 'Cinzel, serif',
    color: '#e0c97f',
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: '#999',
  },
  headerRight: {
    display: 'flex',
    gap: 8,
  },
  uploadBtn: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #d4a843 0%, #b8860b 100%)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 14,
  },
  progressBar: {
    padding: '10px 20px',
    background: 'rgba(212,168,67,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: '#e0c97f',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: 16,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  viewTabs: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 12,
  },
  tabActive: {
    padding: '6px 14px',
    background: 'rgba(212,168,67,0.2)',
    border: '1px solid rgba(212,168,67,0.4)',
    borderRadius: 6,
    color: '#e0c97f',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stats: {
    color: '#888',
    fontSize: 12,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    color: '#e0c97f',
    fontFamily: 'Cinzel, serif',
    fontSize: 20,
    margin: '0 0 8px',
  },
  emptyDesc: {
    color: '#999',
    fontSize: 14,
    maxWidth: 500,
    margin: '0 0 24px',
  },
  formatInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textAlign: 'left',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  formatItem: {
    color: '#bbb',
    fontSize: 12,
  },
  mainLayout: {
    display: 'flex',
    height: 500,
    overflow: 'hidden',
  },
  sidebar: {
    width: 220,
    borderRight: '1px solid rgba(255,255,255,0.06)',
    overflowY: 'auto',
    background: 'rgba(0,0,0,0.15)',
  },
  sidebarTitle: {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  sidebarItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.15s',
  },
  sidebarItemActive: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    background: 'rgba(212,168,67,0.12)',
    borderLeft: '3px solid #e0c97f',
  },
  sidebarItemName: {
    fontSize: 13,
    color: '#eee',
    marginBottom: 4,
  },
  sidebarItemMeta: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  typeBadge: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    color: '#eee',
  },
  animCount: {
    fontSize: 10,
    color: '#888',
  },
  detailPanel: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  groupHeaderLeft: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  groupHeaderRight: {},
  nameInput: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: '#eee',
    padding: '6px 10px',
    fontSize: 14,
    fontFamily: 'Cinzel, serif',
    width: 200,
  },
  typeSelect: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: '#eee',
    padding: '6px 10px',
    fontSize: 12,
  },
  dimLabel: {
    fontSize: 12,
    color: '#888',
  },
  animGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  animCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  animCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  animSelect: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 4,
    color: '#eee',
    padding: '4px 8px',
    fontSize: 12,
    flex: 1,
  },
  frameControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  frameInput: {
    width: 44,
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 4,
    color: '#eee',
    padding: '3px 6px',
    fontSize: 12,
    textAlign: 'center',
  },
  animMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#777',
  },
  metaBadge: {
    fontSize: 9,
    padding: '1px 5px',
    borderRadius: 3,
    background: 'rgba(255,255,255,0.06)',
    color: '#aaa',
  },
  viewportContainer: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  viewportToolbar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  viewportSelect: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: '#eee',
    padding: '6px 12px',
    fontSize: 13,
  },
  animBtns: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  animBtnNormal: {
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 11,
  },
  animBtnActive: {
    padding: '4px 10px',
    background: 'rgba(212,168,67,0.2)',
    border: '1px solid rgba(212,168,67,0.4)',
    borderRadius: 4,
    color: '#e0c97f',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewport: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  viewportBg: {
    background: 'repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    width: '100%',
  },
  viewportInfo: {
    textAlign: 'center',
    color: '#eee',
    fontSize: 14,
  },
  stripPreview: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 12,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  stripLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stripContainer: {
    overflowX: 'auto',
    padding: 4,
  },
  stripImage: {
    maxHeight: 120,
    imageRendering: 'pixelated',
  },
  exportContainer: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  exportHeader: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  generateBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #d4a843 0%, #b8860b 100%)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 13,
  },
  copyBtn: {
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#eee',
    cursor: 'pointer',
    fontSize: 13,
  },
  downloadBtn: {
    padding: '8px 14px',
    background: 'rgba(45,106,79,0.3)',
    border: '1px solid rgba(45,106,79,0.5)',
    borderRadius: 8,
    color: '#9be0b8',
    cursor: 'pointer',
    fontSize: 13,
  },
  jsonPreview: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 16,
    color: '#8be9fd',
    fontSize: 12,
    fontFamily: 'monospace',
    overflowX: 'auto',
    maxHeight: 400,
    overflowY: 'auto',
    whiteSpace: 'pre',
  },
  exportEmpty: {
    color: '#888',
    fontSize: 14,
    padding: 40,
    textAlign: 'center',
  },
};
