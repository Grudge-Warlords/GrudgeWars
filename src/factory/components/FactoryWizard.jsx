import React, { useState, useCallback, useEffect } from 'react';
import { generateGameSpec } from '../generators/specGenerator.js';
import { generateGameImages } from '../generators/imageGenerator.js';
import { GamePreview } from './GamePreview.jsx';
import { AIEditor } from './AIEditor.jsx';
import { deployToPuter } from '../utils/puterDeploy.js';
import SpriteAIWorker from './SpriteAIWorker.jsx';

const STEPS = [
  { id: 'theme', label: 'Theme & Setting' },
  { id: 'factions', label: 'Races & Factions' },
  { id: 'classes', label: 'Classes & Combat' },
  { id: 'world', label: 'World & Lore' },
  { id: 'style', label: 'Art & Style' },
  { id: 'generate', label: 'Generate Game' },
];

const PRESET_THEMES = [
  { name: 'Medieval Knights', setting: 'A war-torn kingdom of castles, dragons, and feudal lords battling for the throne', icon: '⚔️' },
  { name: 'Space Pirates', setting: 'A lawless galaxy of rogue captains, alien species, and ancient space relics', icon: '🚀' },
  { name: 'Samurai Cats', setting: 'Feudal Japan reimagined with noble cat clans warring over sacred temples', icon: '🐱' },
  { name: 'Cyberpunk Hackers', setting: 'A neon-drenched megacity where rogue hackers fight corporate AI overlords', icon: '💻' },
  { name: 'Mushroom Kingdom', setting: 'An enchanted forest of sentient fungi, spore magic, and mycelium networks', icon: '🍄' },
  { name: 'Dinosaur Tribes', setting: 'Prehistoric clans of intelligent dinosaurs wielding primal elemental magic', icon: '🦕' },
  { name: 'Pirate Seas', setting: 'Uncharted tropical waters with treasure islands, sea monsters, and cursed ships', icon: '🏴‍☠️' },
  { name: 'Steampunk Machines', setting: 'A clockwork empire of steam-powered mechs, airships, and inventor guilds', icon: '⚙️' },
  { name: 'Sci Fi Tech Wars', setting: 'A fractured galaxy of rival mega-corporations deploying autonomous war machines, orbital weapon platforms, and nanotech super-soldiers in a ruthless arms race for quantum supremacy', icon: '🤖' },
  { name: 'Anime Big 3', setting: 'An epic crossover world merging Dragon Ball Z, One Piece, and Bleach — Saiyans, Pirates, and Soul Reapers clash across dimensions. Ki blasts, Devil Fruits, and Zanpakuto powers collide in an ultimate battle for supremacy across the mortal realm, the Grand Line, and the Soul Society', icon: '🔥' },
];

const defaultForm = {
  gameName: '',
  studioName: '',
  tagline: '',
  theme: '',
  setting: '',
  raceCount: 6,
  raceNames: '',
  raceStyle: '',
  classCount: 4,
  classNames: '',
  combatStyle: 'turn-based',
  bossCount: 3,
  bossTheme: '',
  worldName: '',
  regionCount: 5,
  regionNames: '',
  lorePremise: '',
  centralConflict: '',
  factionCount: 3,
  factionNames: '',
  artStyle: 'pixel',
  primaryColor: '#06b6d4',
  secondaryColor: '#a855f7',
  accentColor: '#f59e0b',
  dangerColor: '#ef4444',
  bgColor: '#0a0a1a',
  currencyName: 'Gold',
  headingFont: 'Cinzel',
  bodyFont: 'Jost',
};

export function FactoryWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [gameSpec, setGameSpec] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSpriteWorker, setShowSpriteWorker] = useState(false);
  const [generatedImages, setGeneratedImages] = useState({});

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'factory-scroll-fix';
    style.textContent = `
      html, body, #root {
        overflow: auto !important;
        height: auto !important;
        overscroll-behavior: auto !important;
        position: static !important;
      }
      body {
        touch-action: auto !important;
      }
      #root {
        display: block !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('factory-scroll-fix');
      if (el) el.remove();
    };
  }, []);

  const update = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyPreset = useCallback((preset) => {
    setForm(prev => ({
      ...prev,
      theme: preset.name,
      setting: preset.setting,
      gameName: prev.gameName || preset.name + ' Warlords',
      ...(preset.name === 'Anime Big 3' ? { artStyle: 'anime' } : {}),
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setProgress('Initializing AI content generator...');
    try {
      const spec = await generateGameSpec(form, (msg) => setProgress(msg));
      setGameSpec(spec);

      if (window.puter) {
        setProgress('Generating AI artwork for your game...');
        try {
          const images = await generateGameImages(form, spec, (msg) => setProgress(msg));
          setGeneratedImages(images);
          if (Object.keys(images).length > 0) {
            const updatedSpec = {
              ...spec,
              assets: { ...(spec.assets || {}), generatedImages: images },
            };
            setGameSpec(updatedSpec);
          }
          setProgress('Game and artwork generated successfully!');
        } catch (imgErr) {
          console.warn('Image generation failed:', imgErr);
          setProgress('Game generated! (Image generation unavailable)');
        }
      } else {
        setProgress('Game generated! Open on Puter.com for AI artwork.');
      }
    } catch (err) {
      setProgress('Error: ' + err.message);
    }
    setGenerating(false);
  }, [form]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${form.bgColor} 0%, #1a1a2e 50%, ${form.bgColor} 100%)`,
      color: '#e2e8f0',
      fontFamily: `'${form.bodyFont}', sans-serif`,
      padding: '20px',
    },
    header: {
      textAlign: 'center',
      padding: '30px 0',
    },
    title: {
      fontFamily: `'${form.headingFont}', serif`,
      fontSize: 'clamp(24px, 5vw, 42px)',
      background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#94a3b8',
      fontSize: '14px',
    },
    stepBar: {
      display: 'flex',
      justifyContent: 'center',
      gap: '4px',
      flexWrap: 'wrap',
      margin: '20px auto',
      maxWidth: '700px',
    },
    stepDot: (i) => ({
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: i === step ? '700' : '400',
      background: i === step ? form.primaryColor : i < step ? form.secondaryColor + '40' : '#1e293b',
      color: i === step ? '#fff' : i < step ? form.secondaryColor : '#64748b',
      border: i < step ? `1px solid ${form.secondaryColor}40` : '1px solid #334155',
      cursor: 'pointer',
      transition: 'all 0.3s',
    }),
    card: {
      maxWidth: '700px',
      margin: '20px auto',
      background: 'rgba(15, 23, 42, 0.8)',
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '30px',
      backdropFilter: 'blur(10px)',
    },
    label: {
      display: 'block',
      color: form.primaryColor,
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '15px',
      fontFamily: `'${form.bodyFont}', sans-serif`,
      outline: 'none',
      marginBottom: '16px',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '15px',
      fontFamily: `'${form.bodyFont}', sans-serif`,
      outline: 'none',
      marginBottom: '16px',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box',
    },
    presetGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '10px',
      marginBottom: '20px',
    },
    presetCard: (selected) => ({
      padding: '14px',
      borderRadius: '12px',
      background: selected ? form.primaryColor + '20' : '#1e293b',
      border: selected ? `2px solid ${form.primaryColor}` : '1px solid #334155',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.3s',
    }),
    presetIcon: {
      fontSize: '28px',
      marginBottom: '6px',
    },
    presetName: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#e2e8f0',
    },
    row: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
    },
    half: {
      flex: '1',
      minWidth: '200px',
    },
    colorRow: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      marginBottom: '16px',
    },
    colorPick: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    },
    colorInput: {
      width: '50px',
      height: '50px',
      border: '2px solid #334155',
      borderRadius: '12px',
      cursor: 'pointer',
      background: 'none',
      padding: '2px',
    },
    colorLabel: {
      fontSize: '10px',
      color: '#94a3b8',
      textTransform: 'uppercase',
    },
    slider: {
      width: '100%',
      accentColor: form.primaryColor,
      marginBottom: '16px',
    },
    navRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px',
    },
    btn: (variant) => ({
      padding: '12px 28px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      fontFamily: `'${form.headingFont}', serif`,
      background: variant === 'primary' ? `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` : '#1e293b',
      color: '#fff',
      transition: 'all 0.3s',
      opacity: generating ? 0.6 : 1,
    }),
    progressBox: {
      padding: '20px',
      borderRadius: '12px',
      background: '#0f172a',
      border: `1px solid ${form.primaryColor}40`,
      textAlign: 'center',
      marginTop: '20px',
    },
    progressText: {
      color: form.primaryColor,
      fontSize: '14px',
      marginBottom: '10px',
    },
    progressBar: {
      height: '4px',
      borderRadius: '2px',
      background: '#1e293b',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: `linear-gradient(90deg, ${form.primaryColor}, ${form.accentColor})`,
      borderRadius: '2px',
      animation: generating ? 'progressPulse 2s ease-in-out infinite' : 'none',
      width: generating ? '60%' : gameSpec ? '100%' : '0%',
      transition: 'width 0.5s',
    },
    resultActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginTop: '20px',
      flexWrap: 'wrap',
    },
    sectionTitle: {
      fontFamily: `'${form.headingFont}', serif`,
      fontSize: '20px',
      color: form.primaryColor,
      marginBottom: '16px',
    },
    hint: {
      fontSize: '12px',
      color: '#64748b',
      marginBottom: '12px',
    },
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h3 style={styles.sectionTitle}>Choose Your Theme</h3>
            <p style={styles.hint}>Pick a preset or create your own unique theme</p>
            <div style={styles.presetGrid}>
              {PRESET_THEMES.map(p => (
                <div key={p.name} style={styles.presetCard(form.theme === p.name)} onClick={() => applyPreset(p)}>
                  <div style={styles.presetIcon}>{p.icon}</div>
                  <div style={styles.presetName}>{p.name}</div>
                </div>
              ))}
            </div>
            <label style={styles.label}>Game Name</label>
            <input style={styles.input} value={form.gameName} onChange={e => update('gameName', e.target.value)} placeholder="e.g. Dragon Knights Online" />
            <label style={styles.label}>Studio Name</label>
            <input style={styles.input} value={form.studioName} onChange={e => update('studioName', e.target.value)} placeholder="e.g. My Awesome Studio" />
            <label style={styles.label}>Theme / Genre</label>
            <input style={styles.input} value={form.theme} onChange={e => update('theme', e.target.value)} placeholder="e.g. Medieval Knights, Space Pirates" />
            <label style={styles.label}>Setting Description</label>
            <textarea style={styles.textarea} value={form.setting} onChange={e => update('setting', e.target.value)} placeholder="Describe the world your game takes place in..." />
            <label style={styles.label}>Tagline</label>
            <input style={styles.input} value={form.tagline} onChange={e => update('tagline', e.target.value)} placeholder="e.g. Where Legends Are Forged" />
          </div>
        );

      case 1:
        return (
          <div>
            <h3 style={styles.sectionTitle}>Races & Factions</h3>
            <p style={styles.hint}>Define the playable races and world factions. AI will flesh out the details.</p>
            <label style={styles.label}>Number of Playable Races: {form.raceCount}</label>
            <input type="range" min="2" max="12" style={styles.slider} value={form.raceCount} onChange={e => update('raceCount', +e.target.value)} />
            <label style={styles.label}>Race Names (comma-separated, or leave blank for AI)</label>
            <textarea style={styles.textarea} value={form.raceNames} onChange={e => update('raceNames', e.target.value)} placeholder="e.g. Fire Dragon, Ice Phoenix, Shadow Wolf, Storm Eagle..." />
            <label style={styles.label}>Race Style / Inspiration</label>
            <input style={styles.input} value={form.raceStyle} onChange={e => update('raceStyle', e.target.value)} placeholder="e.g. Based on mythical creatures, Real animals, Alien species" />
            <label style={styles.label}>Number of World Factions: {form.factionCount}</label>
            <input type="range" min="2" max="6" style={styles.slider} value={form.factionCount} onChange={e => update('factionCount', +e.target.value)} />
            <label style={styles.label}>Faction Names (comma-separated, or leave blank for AI)</label>
            <textarea style={styles.textarea} value={form.factionNames} onChange={e => update('factionNames', e.target.value)} placeholder="e.g. Order of Light, Shadow Covenant, Wild Hunt..." />
          </div>
        );

      case 2:
        return (
          <div>
            <h3 style={styles.sectionTitle}>Classes & Combat</h3>
            <p style={styles.hint}>Define the class system and combat mechanics</p>
            <label style={styles.label}>Number of Classes: {form.classCount}</label>
            <input type="range" min="2" max="8" style={styles.slider} value={form.classCount} onChange={e => update('classCount', +e.target.value)} />
            <label style={styles.label}>Class Names (comma-separated, or leave blank for AI)</label>
            <textarea style={styles.textarea} value={form.classNames} onChange={e => update('classNames', e.target.value)} placeholder="e.g. Knight, Mage, Rogue, Cleric..." />
            <label style={styles.label}>Combat Style</label>
            <div style={styles.row}>
              {['turn-based', 'real-time', 'tactical-grid'].map(cs => (
                <div key={cs} style={{
                  ...styles.presetCard(form.combatStyle === cs),
                  flex: '1', minWidth: '120px'
                }} onClick={() => update('combatStyle', cs)}>
                  <div style={styles.presetName}>{cs.replace(/-/g, ' ').toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={styles.label}>Number of Bosses: {form.bossCount}</label>
              <input type="range" min="1" max="10" style={styles.slider} value={form.bossCount} onChange={e => update('bossCount', +e.target.value)} />
              <label style={styles.label}>Boss Theme / Style</label>
              <input style={styles.input} value={form.bossTheme} onChange={e => update('bossTheme', e.target.value)} placeholder="e.g. Ancient corrupted guardians, Rival warlords, Elemental titans" />
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 style={styles.sectionTitle}>World & Lore</h3>
            <p style={styles.hint}>Build your game's world, story, and lore foundation</p>
            <label style={styles.label}>World Name</label>
            <input style={styles.input} value={form.worldName} onChange={e => update('worldName', e.target.value)} placeholder="e.g. Valorheim, Nova Sector, Neko Empire" />
            <label style={styles.label}>Central Conflict / Story Premise</label>
            <textarea style={styles.textarea} value={form.centralConflict} onChange={e => update('centralConflict', e.target.value)} placeholder="What is the main conflict? e.g. An ancient evil has awakened, fracturing the realm into warring factions..." />
            <label style={styles.label}>Lore Premise / History</label>
            <textarea style={{...styles.textarea, minHeight: '120px'}} value={form.lorePremise} onChange={e => update('lorePremise', e.target.value)} placeholder="Background lore, history, mythology... AI will expand on whatever you provide" />
            <label style={styles.label}>Number of Map Regions: {form.regionCount}</label>
            <input type="range" min="3" max="8" style={styles.slider} value={form.regionCount} onChange={e => update('regionCount', +e.target.value)} />
            <label style={styles.label}>Region Names (comma-separated, or leave blank for AI)</label>
            <textarea style={styles.textarea} value={form.regionNames} onChange={e => update('regionNames', e.target.value)} placeholder="e.g. Sunlit Meadows, Shadow Mountains, Crystal Caves..." />
          </div>
        );

      case 4:
        return (
          <div>
            <h3 style={styles.sectionTitle}>Art & Style</h3>
            <p style={styles.hint}>Customize the visual style and color palette</p>
            <label style={styles.label}>Art Style</label>
            <div style={styles.row}>
              {['pixel', 'hand-drawn', 'anime', 'realistic', 'low-poly'].map(as => (
                <div key={as} style={{
                  ...styles.presetCard(form.artStyle === as),
                  flex: '1', minWidth: '100px'
                }} onClick={() => update('artStyle', as)}>
                  <div style={styles.presetName}>{as.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={styles.label}>Color Palette</label>
              <div style={styles.colorRow}>
                {[
                  { key: 'primaryColor', label: 'Primary' },
                  { key: 'secondaryColor', label: 'Secondary' },
                  { key: 'accentColor', label: 'Accent' },
                  { key: 'dangerColor', label: 'Danger' },
                  { key: 'bgColor', label: 'Background' },
                ].map(c => (
                  <div key={c.key} style={styles.colorPick}>
                    <input type="color" style={styles.colorInput} value={form[c.key]} onChange={e => update(c.key, e.target.value)} />
                    <span style={styles.colorLabel}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.half}>
                <label style={styles.label}>Currency Name</label>
                <input style={styles.input} value={form.currencyName} onChange={e => update('currencyName', e.target.value)} placeholder="e.g. Gold, Credits, Gems" />
              </div>
              <div style={styles.half}>
                <label style={styles.label}>Heading Font</label>
                <input style={styles.input} value={form.headingFont} onChange={e => update('headingFont', e.target.value)} placeholder="e.g. Cinzel, MedievalSharp" />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3 style={styles.sectionTitle}>Generate Your Game</h3>
            <p style={styles.hint}>Review your settings and generate a complete RPG game</p>
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><span style={{ color: '#64748b' }}>Game:</span> <span style={{ color: form.primaryColor }}>{form.gameName || 'Unnamed'}</span></div>
                <div><span style={{ color: '#64748b' }}>Theme:</span> <span style={{ color: form.secondaryColor }}>{form.theme || 'None'}</span></div>
                <div><span style={{ color: '#64748b' }}>Races:</span> {form.raceCount}</div>
                <div><span style={{ color: '#64748b' }}>Classes:</span> {form.classCount}</div>
                <div><span style={{ color: '#64748b' }}>Bosses:</span> {form.bossCount}</div>
                <div><span style={{ color: '#64748b' }}>Regions:</span> {form.regionCount}</div>
                <div><span style={{ color: '#64748b' }}>Art Style:</span> {form.artStyle}</div>
                <div><span style={{ color: '#64748b' }}>Combat:</span> {form.combatStyle}</div>
              </div>
            </div>

            {!gameSpec && (
              <div style={{ textAlign: 'center' }}>
                <button style={styles.btn('primary')} onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Game'}
                </button>
              </div>
            )}

            {progress && (
              <div style={styles.progressBox}>
                <div style={styles.progressText}>{progress}</div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill} />
                </div>
              </div>
            )}

            {gameSpec && (
              <div style={styles.resultActions}>
                <button style={styles.btn('primary')} onClick={() => setShowPreview(true)}>Preview Game</button>
                <button style={styles.btn('primary')} onClick={() => setShowEditor(true)}>AI Editor</button>
                <button style={styles.btn('primary')} onClick={async () => {
                  setProgress('Deploying to Puter...');
                  try {
                    const result = await deployToPuter(gameSpec);
                    setProgress('Deployed! Live at: ' + result.url);
                  } catch(e) {
                    setProgress('Deploy: ' + e.message);
                  }
                }}>Deploy to Puter</button>
                <button style={styles.btn('secondary')} onClick={() => {
                  const blob = new Blob([JSON.stringify(gameSpec, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = (form.gameName || 'game') + '-spec.json';
                  a.click();
                }}>Download Spec</button>
                <button style={styles.btn('secondary')} onClick={async () => {
                  if (window.puter) {
                    try {
                      await puter.kv.set('factory_' + Date.now(), JSON.stringify(gameSpec));
                      alert('Saved to Puter cloud!');
                    } catch(e) { alert('Save failed: ' + e.message); }
                  } else {
                    localStorage.setItem('factory_gameSpec', JSON.stringify(gameSpec));
                    alert('Saved locally!');
                  }
                }}>Save to Cloud</button>
              </div>
            )}

            {Object.keys(generatedImages).length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h4 style={{
                  fontFamily: `'${form.headingFont}', serif`, fontSize: '18px',
                  color: form.primaryColor, marginBottom: '16px', textAlign: 'center',
                }}>Generated Artwork</h4>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}>
                  {Object.entries(generatedImages).map(([key, src]) => {
                    const labels = {
                      background: 'World Background',
                      battleBg: 'Battle Arena',
                      cardBg: 'Card Design',
                      titleBg: 'Title Screen',
                      mapBg: 'World Map',
                      bossPortrait: 'Boss Portrait',
                      characterPortrait: 'Character Portrait',
                    };
                    return (
                      <div key={key} style={{
                        background: '#0f172a', borderRadius: '12px', overflow: 'hidden',
                        border: '1px solid #334155',
                      }}>
                        <img src={src} alt={labels[key] || key} style={{
                          width: '100%', height: '200px', objectFit: 'cover', display: 'block',
                        }} />
                        <div style={{
                          padding: '10px 14px', fontSize: '12px', fontWeight: '600',
                          color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px',
                        }}>{labels[key] || key}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (showSpriteWorker) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)', padding: 20 }}>
        <button onClick={() => setShowSpriteWorker(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #d4a843', background: 'transparent', color: '#d4a843', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
          ← Back to Factory
        </button>
        <SpriteAIWorker />
      </div>
    );
  }

  if (showPreview && gameSpec) {
    return <GamePreview spec={gameSpec} generatedImages={generatedImages} onBack={() => setShowPreview(false)} />;
  }

  if (showEditor && gameSpec) {
    return <AIEditor spec={gameSpec} onUpdate={setGameSpec} onBack={() => setShowEditor(false)} />;
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes progressPulse {
          0%, 100% { width: 30%; }
          50% { width: 80%; }
        }
      `}</style>
      <div style={{ ...styles.header, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={styles.title}>Game Factory</h1>
          <p style={styles.subtitle}>AI-Powered RPG Generator by {form.studioName || 'Grudge Studios'}</p>
        </div>
        <button onClick={() => setShowSpriteWorker(true)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', padding: '8px 16px', background: 'linear-gradient(135deg, #d4a843 0%, #b8860b 100%)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
          🤖 Sprite AI Worker
        </button>
      </div>

      <div style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={styles.stepDot(i)} onClick={() => setStep(i)}>
            {s.label}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {renderStep()}
        <div style={styles.navRow}>
          <button style={styles.btn('secondary')} onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
          {step < STEPS.length - 1 && (
            <button style={styles.btn('primary')} onClick={() => setStep(step + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
