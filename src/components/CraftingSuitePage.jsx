import React, { useState, useEffect, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import {
  fetchRecipes,
  fetchUnlockedRecipes,
  fetchInventory,
  submitCraft,
  claimCraft,
  fetchCraftingJobs,
  fetchProfessions,
  fetchSuiteStatus,
  getCurrentGrudgeId,
  hasCraftingAuth,
  collectHarvest,
} from '../services/craftingApi';
import { TIERS, DISPLAY_STAT_MAP } from '../data/equipment';
import {
  OBJECTSTORE_BASE,
  getProfessionIcon,
  getMaterialIcon,
  getWeaponIcon,
  getConsumableIcon,
  getNamedWeaponIcon,
  getArmorIcon,
} from '../data/objectStoreIcons';
import { showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';

// ── Constants ──

const OBJECTSTORE_URL = OBJECTSTORE_BASE;

const PROFESSIONS = [
  { key: 'Miner',    icon: '⛏️', color: '#ef4444', role: 'Metal · Weapons · Armor' },
  { key: 'Forester', icon: '🪓', color: '#22c55e', role: 'Wood · Bows · Leather' },
  { key: 'Mystic',   icon: '🔮', color: '#a78bfa', role: 'Cloth · Staves · Enchants' },
  { key: 'Chef',     icon: '🍳', color: '#f59e0b', role: 'Food · Potions · Buffs' },
  { key: 'Engineer', icon: '⚙️', color: '#60a5fa', role: 'Guns · Crossbows · Traps' },
];

// Use canonical TIERS from equipment.js, extend with T0 for crafting basics
const TIER_META = {
  0: { name: 'Crude', color: '#6b7280' },
  ...Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { name: v.name, color: v.color }])),
};

const MAT_ICONS = {
  'Wood Scraps':'🪵','Stone Fragments':'🪨','Plant Fiber':'🌿','Animal Hide':'🦌',
  'Animal Bone':'🦴','Raw Meat':'🥩','Wild Herbs':'🌿','Water':'💧',
  'Junk Ore':'⛏️','Scrap Metal':'🔩','Torn Rag':'🧵','Leather Scraps':'🟤',
  'Charcoal':'⬛','Rotted Wood':'🪵','Copper Ore':'🟠','Iron Ore':'⬜',
  'Pine Log':'🌲','Oak Log':'🌳','Arcane Dust':'✨','Herb':'🌿',
  'Simple Thread':'🧵','Crude Leather':'🟤','Raw Essence':'✨','Linen Cloth':'🧶',
  'Crude Mechanism':'⚙️','Rough Plank':'🪵','Pine Plank':'🪵','Oak Plank':'🪵',
  'Copper Ingot':'🟠','Iron Ingot':'⬜','Hardened Leather':'🟤',
  'Minor Essence':'💫','Precision Gears':'⚙️','Parchment':'📜','Ink':'🖋️',
};

// Map crafting recipe type keywords to ObjectStore icon resolver
const TYPE_ICON_RESOLVERS = {
  weapon: (name) => getNamedWeaponIcon(name.toLowerCase().replace(/\s+/g, '-')) || getWeaponIcon('sword'),
  armor: (_name, tier) => getArmorIcon('armor', Math.max(1, tier || 1)),
  consumable: (_name, tier) => getConsumableIcon(Math.min(30, Math.max(1, (tier || 0) * 4 + 1))),
};

// Hardcoded recipes (same as Puter crafting site — server recipes merge with these)
const LOCAL_RECIPES = [
  { id:'parchment', n:'Parchment', prof:'All', type:'Refining', tier:0, icon:'📜', mats:{'Plant Fiber':3}, desc:'Thin writing surface' },
  { id:'simple-thread', n:'Simple Thread', prof:'All', type:'Refining', tier:0, icon:'🧵', mats:{'Plant Fiber':5}, desc:'Basic thread spun from fibers' },
  { id:'ink', n:'Ink', prof:'All', type:'Refining', tier:0, icon:'🖋️', mats:{'Charcoal':1,'Water':1}, desc:'Dark writing fluid' },
  { id:'crude-bandage', n:'Crude Bandage', prof:'All', type:'Consumable', tier:0, icon:'🩹', mats:{'Torn Rag':2}, desc:'Stops bleeding, +10 HP/10s' },
  { id:'minor-hp', n:'Minor Health Potion', prof:'All', type:'Consumable', tier:0, icon:'❤️', mats:{'Herb':2,'Water':1}, desc:'Restores 25 HP' },
  { id:'minor-mp', n:'Minor Mana Potion', prof:'All', type:'Consumable', tier:0, icon:'💙', mats:{'Arcane Dust':1,'Water':2}, desc:'Restores 25 Mana' },
  { id:'wooden-club', n:'Wooden Club', prof:'All', type:'Weapon', tier:0, icon:'🏏', mats:{'Rotted Wood':3}, desc:'Crude bludgeon, 3 DMG' },
  { id:'stone-knife', n:'Stone Knife', prof:'All', type:'Weapon', tier:0, icon:'🔪', mats:{'Stone Fragments':2,'Simple Thread':1}, desc:'Sharp stone dagger, 2 DMG' },
  { id:'wooden-sword', n:'Wooden Sword', prof:'All', type:'Weapon', tier:0, icon:'⚔️', mats:{'Wood Scraps':3,'Plant Fiber':1}, desc:'Starter sword, 3 DMG' },
  { id:'tattered-shirt', n:'Tattered Shirt', prof:'All', type:'Armor', tier:0, icon:'👕', mats:{'Torn Rag':4,'Simple Thread':2}, desc:'+1 Defense' },
  { id:'scrap-helm', n:'Scrap Helm', prof:'All', type:'Armor', tier:0, icon:'⛑️', mats:{'Scrap Metal':2}, desc:'+1 Defense' },
  { id:'smelt-scrap', n:'Smelt Scrap Metal', prof:'Miner', type:'Refining', tier:0, icon:'🔩', mats:{'Junk Ore':3}, desc:'Salvage metal from junk' },
  { id:'copper-ingot', n:'Copper Ingot', prof:'Miner', type:'Refining', tier:1, icon:'🟠', mats:{'Copper Ore':3}, desc:'Refined copper bar' },
  { id:'iron-ingot', n:'Iron Ingot', prof:'Miner', type:'Refining', tier:1, icon:'⬜', mats:{'Iron Ore':3}, desc:'Refined iron bar' },
  { id:'bloodfeud-blade', n:'Bloodfeud Blade', prof:'Miner', type:'Weapon', tier:1, icon:'⚔️', mats:{'Copper Ingot':3,'Wooden Sword':1,'Simple Thread':2}, desc:'T1 Sword · 12 DMG' },
  { id:'gorehowl', n:'Gorehowl', prof:'Miner', type:'Weapon', tier:1, icon:'🪓', mats:{'Iron Ingot':2,'Stone Hatchet':1,'Animal Hide':1}, desc:'T1 Axe · 14 DMG' },
  { id:'grudgehammer', n:'Grudgehammer', prof:'Miner', type:'Weapon', tier:1, icon:'🔨', mats:{'Iron Ingot':3,'Rusty Mace':1}, desc:'T1 Hammer · 16 DMG' },
  { id:'rough-plank', n:'Rough Plank', prof:'Forester', type:'Refining', tier:0, icon:'🪵', mats:{'Rotted Wood':2}, desc:'Crude wooden plank' },
  { id:'shortbow', n:'Shortbow', prof:'Forester', type:'Weapon', tier:0, icon:'🏹', mats:{'Wood Scraps':3,'Plant Fiber':2}, desc:'Basic bow, 4 DMG' },
  { id:'crude-leather', n:'Crude Leather', prof:'Forester', type:'Refining', tier:0, icon:'🟤', mats:{'Animal Hide':2}, desc:'Tanned hide piece' },
  { id:'wraithbone-bow', n:'Wraithbone Bow', prof:'Forester', type:'Weapon', tier:1, icon:'🏹', mats:{'Pine Plank':2,'Shortbow':1,'Simple Thread':3}, desc:'T1 Bow · 11 DMG' },
  { id:'raw-essence', n:'Raw Essence', prof:'Mystic', type:'Refining', tier:0, icon:'✨', mats:{'Arcane Dust':2,'Water':1}, desc:'Unrefined magical energy' },
  { id:'crude-staff', n:'Crude Staff', prof:'Mystic', type:'Weapon', tier:0, icon:'🪄', mats:{'Rotted Wood':3,'Raw Essence':1}, desc:'Basic staff, 3 DMG + 5 SP' },
  { id:'emberwrath', n:'Emberwrath', prof:'Mystic', type:'Weapon', tier:1, icon:'🔥', mats:{'Crude Staff':1,'Minor Essence':2,'Copper Ingot':1}, desc:'T1 Fire Staff · 10 DMG + 15 SP' },
  { id:'charred-meat', n:'Charred Meat', prof:'Chef', type:'Consumable', tier:0, icon:'🥩', mats:{'Raw Meat':1}, desc:'+15 HP · Basic food' },
  { id:'herb-soup', n:'Herb Soup', prof:'Chef', type:'Consumable', tier:0, icon:'🥣', mats:{'Wild Herbs':2,'Water':2}, desc:'+20 HP · +5 MP' },
  { id:'seasoned-steak', n:'Seasoned Steak', prof:'Chef', type:'Consumable', tier:1, icon:'🥩', mats:{'Raw Meat':2,'Wild Herbs':1,'Charred Meat':1}, desc:'+40 HP · +5 STR buff 5min' },
  { id:'crude-parts', n:'Crude Mechanism', prof:'Engineer', type:'Refining', tier:0, icon:'⚙️', mats:{'Scrap Metal':2,'Stone Fragments':1}, desc:'Basic mechanical parts' },
  { id:'slingshot', n:'Slingshot', prof:'Engineer', type:'Weapon', tier:0, icon:'🎯', mats:{'Wood Scraps':2,'Leather Scraps':2}, desc:'Ranged weapon, 3 DMG' },
  { id:'shadowflight', n:'Shadowflight Crossbow', prof:'Engineer', type:'Weapon', tier:1, icon:'🏹', mats:{'Pine Plank':2,'Precision Gears':2,'Slingshot':1}, desc:'T1 Crossbow · 13 DMG' },
];

// ── Helpers ──

function tierLabel(tier) {
  const meta = TIER_META[tier];
  return meta ? `T${tier} ${meta.name}` : `T${tier}`;
}

function tierColor(tier) {
  return TIER_META[tier]?.color || '#6b7280';
}

function resolveItemIconUrl(name, type, tier, iconMap) {
  // 1. Try ObjectStore items-database icon map (name-based)
  const osUrl = iconMap[name?.toLowerCase()];
  if (osUrl) return osUrl;
  // 2. Try type-based resolver from objectStoreIcons
  const typeLower = (type || '').toLowerCase();
  const resolver = TYPE_ICON_RESOLVERS[typeLower];
  if (resolver) return resolver(name || '', tier);
  return null;
}

// Tooltip helpers
function itemTooltipContent(item) {
  const name = item.n || item.name || 'Unknown';
  const tier = item.tier ?? 0;
  const meta = TIER_META[tier];
  const tierStr = meta ? `T${tier} ${meta.name}` : `T${tier}`;
  const desc = item.desc || item.description || '';
  const prof = item.prof || '';
  const type = item.type || '';
  const lines = [name];
  if (tierStr || prof || type) lines.push([tierStr, prof, type].filter(Boolean).join(' · '));
  if (desc) lines.push(desc);
  if (item.mats) {
    lines.push('Materials: ' + Object.entries(item.mats).map(([m, q]) => `${m} ×${q}`).join(', '));
  }
  return lines.join('\n');
}

function tipHandlers(content) {
  return {
    onMouseEnter: (e) => showTooltip(content, e),
    onMouseMove: (e) => updateTooltipPosition(e),
    onMouseLeave: () => hideTooltip(),
  };
}

// ── Item Icon Hook (ObjectStore) ──

function useItemIconMap() {
  const [iconMap, setIconMap] = useState({});
  useEffect(() => {
    fetch(`${OBJECTSTORE_URL}/api/v1/items-database.json`)
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data.items || []).forEach(item => {
          if (item.icon) map[item.name.toLowerCase()] = item.icon;
        });
        setIconMap(map);
      })
      .catch(() => {});
  }, []);
  return iconMap;
}

function ItemIcon({ name, emoji, size = 20, iconMap, type, tier }) {
  // Prefer ObjectStore resolved icon (items-database or type-based)
  const resolved = resolveItemIconUrl(name, type, tier, iconMap);
  if (resolved) {
    return <img src={resolved} alt={name} style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated', verticalAlign: 'middle', borderRadius: 2 }} loading="lazy" />;
  }
  return <span style={{ fontSize: size * 0.8 }}>{emoji || MAT_ICONS[name] || '📦'}</span>;
}

function ProfIcon({ profKey, size = 24 }) {
  const url = getProfessionIcon(profKey);
  if (url) {
    return <img src={url} alt={profKey} style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} loading="lazy" />;
  }
  const prof = PROFESSIONS.find(p => p.key === profKey);
  return <span style={{ fontSize: size * 0.8 }}>{prof?.icon || '⚒️'}</span>;
}

// ── Styles ──

const VARS = {
  gold: '#d4a843', goldBright: '#f0c040', goldDim: '#7a5c0e',
  deep: '#0a0a10', deep2: '#0e0e18',
  panel: 'rgba(14,14,24,0.95)', panel2: 'rgba(20,20,32,0.9)',
  border: 'rgba(212,168,67,0.15)', borderHot: 'rgba(212,168,67,0.5)',
  text: '#d0d0d0', textDim: '#666',
  green: '#22c55e', red: '#ef4444', blue: '#60a5fa', purple: '#a78bfa', orange: '#f59e0b',
};

const sidebarW = 220;

// ── Sub-components ──

function SuiteCard({ title, children, style }) {
  return (
    <div style={{ background: VARS.panel, border: `1px solid ${VARS.border}`, borderRadius: 8, padding: 16, marginBottom: 12, ...style }}>
      {title && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: VARS.gold, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${VARS.border}` }}>{title}</div>}
      {children}
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${VARS.border}`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: VARS.gold }}>{value}</div>
      <div style={{ fontSize: 10, color: VARS.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function XpBar({ pct, color }) {
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color || VARS.green, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 6, border: `1px solid ${active ? VARS.gold : VARS.border}`,
      background: active ? 'rgba(212,168,67,0.15)' : 'rgba(0,0,0,0.2)',
      color: active ? VARS.gold : VARS.textDim, fontSize: 11, cursor: 'pointer',
      fontFamily: 'inherit', fontWeight: active ? 600 : 400, transition: 'all 0.15s',
    }}>{children}</button>
  );
}

// ── Dashboard Page ──

function DashboardPage({ recipes, suiteInventory, suiteResources, profData, jobs, log, iconMap }) {
  const totalItems = suiteInventory.length;
  const totalResources = suiteResources.reduce((a, r) => a + (r.quantity || 0), 0);
  const activeJobs = jobs.filter(j => j.status !== 'claimed').length;
  const profEntries = Object.entries(profData);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: VARS.gold }}>⚔ Crafting Dashboard</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard value={recipes.length} label="Recipes" />
        <StatCard value={totalItems} label="Items" />
        <StatCard value={Math.floor(totalResources)} label="Resources" />
        <StatCard value={activeJobs} label="Active Jobs" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <SuiteCard title="Professions">
          {PROFESSIONS.map(p => {
            const data = profData[p.key] || {};
            const level = data.level || 1;
            const xp = data.xp || 0;
            const xpNext = data.xpToNext || 100;
            const pct = xpNext > 0 ? (xp / xpNext) * 100 : 0;
            return (
              <div key={p.key} style={{ marginBottom: 10, cursor: 'default' }} {...tipHandlers(`${p.key}\nLevel ${level} · ${xp}/${xpNext} XP\n${p.role}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ProfIcon profKey={p.key} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: VARS.text }}>{p.key}</div>
                    <div style={{ fontSize: 10, color: VARS.textDim }}>{p.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: p.color }}>Lv {level}</div>
                    <div style={{ fontSize: 9, color: VARS.textDim }}>{xp}/{xpNext} XP</div>
                  </div>
                </div>
                <XpBar pct={pct} color={p.color} />
              </div>
            );
          })}
        </SuiteCard>
        <SuiteCard title="Active Crafting Jobs">
          {jobs.length === 0 ? (
            <div style={{ color: VARS.textDim, fontSize: 11, textAlign: 'center', padding: 20 }}>No active jobs</div>
          ) : (
            jobs.slice(0, 8).map(job => {
              const ready = job.status === 'completed' || (job.completesAt && new Date(job.completesAt).getTime() <= Date.now());
              return (
                <div key={job.id} style={{ fontSize: 11, padding: '6px 0', borderBottom: `1px solid ${VARS.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: VARS.text }}>{job.recipeName || job.recipeId}</span>
                  <span style={{ color: ready ? VARS.green : VARS.orange, fontSize: 10 }}>{ready ? '✓ Ready' : 'Crafting...'}</span>
                </div>
              );
            })
          )}
        </SuiteCard>
      </div>
      <SuiteCard title="Recent Activity" style={{ marginTop: 12 }}>
        {log.length === 0 ? (
          <div style={{ color: VARS.textDim, fontSize: 11, textAlign: 'center', padding: 10 }}>No activity yet</div>
        ) : (
          log.slice(0, 15).map((entry, i) => (
            <div key={i} style={{ fontSize: 11, padding: '3px 0', color: VARS.textDim, borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
              <span style={{ color: '#555', fontSize: 10, marginRight: 8 }}>{entry.time}</span>
              {entry.msg}
            </div>
          ))
        )}
      </SuiteCard>
    </div>
  );
}

// ── Crafting Bench Page ──

function CraftingBenchPage({ recipes, inventory, resources, suiteGold, grudgeId, jobs, onCraft, onClaimJob, iconMap, addLog }) {
  const [profFilter, setProfFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [crafting, setCrafting] = useState(false);
  const [craftProgress, setCraftProgress] = useState(0);

  // Merge local and server recipes
  const allRecipes = recipes;
  const tiers = [...new Set(allRecipes.map(r => r.tier ?? 0))].sort();
  const types = [...new Set(allRecipes.map(r => (r.type || 'other').toLowerCase()))];

  const filtered = allRecipes.filter(r => {
    if (profFilter !== 'All' && r.prof !== profFilter && r.prof !== 'All') return false;
    if (tierFilter !== 'all' && (r.tier ?? 0) !== parseInt(tierFilter)) return false;
    if (typeFilter !== 'all' && (r.type || '').toLowerCase() !== typeFilter) return false;
    return true;
  });

  // Resource lookup (merge suiteResources + local inventory for display)
  const resMap = {};
  (resources || []).forEach(r => { resMap[r.resourceType || r.name] = (resMap[r.resourceType || r.name] || 0) + (r.quantity || 0); });
  Object.entries(inventory || {}).forEach(([k, v]) => { resMap[k] = (resMap[k] || 0) + v; });

  const checkCanCraft = (recipe) => {
    if (!recipe.mats) return true;
    return Object.entries(recipe.mats).every(([mat, qty]) => (resMap[mat] || 0) >= qty);
  };

  const handleCraft = async (recipe) => {
    if (crafting) return;
    setCrafting(true);
    setCraftProgress(0);
    const start = Date.now();
    const duration = 1500;
    const animate = () => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setCraftProgress(pct);
      if (pct < 100) requestAnimationFrame(animate);
      else {
        setCrafting(false);
        setCraftProgress(0);
        if (onCraft) onCraft(recipe);
      }
    };
    requestAnimationFrame(animate);
  };

  const pendingJobs = (jobs || []).filter(j => j.status !== 'claimed');
  const now = Date.now();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: VARS.gold }}>🔨 Crafting Bench</h2>
        <select value={profFilter} onChange={e => setProfFilter(e.target.value)} style={{
          background: VARS.deep, color: VARS.text, padding: '6px 10px', border: `1px solid ${VARS.border}`,
          borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <option value="All">All Professions</option>
          {PROFESSIONS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.key}</option>)}
        </select>
      </div>
      {/* Tier + Type Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <FilterBtn active={tierFilter === 'all'} onClick={() => setTierFilter('all')}>All Tiers</FilterBtn>
        {tiers.map(t => <FilterBtn key={t} active={tierFilter === String(t)} onClick={() => setTierFilter(String(t))}>T{t}</FilterBtn>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <FilterBtn active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All Types</FilterBtn>
        {types.map(t => <FilterBtn key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</FilterBtn>)}
      </div>
      {/* Recipe List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: 4 }}>
          {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: VARS.textDim }}>No recipes match filters</div>}
          {filtered.map(r => {
            const canCraft = checkCanCraft(r);
            const isSelected = selected?.id === r.id;
            const t = r.tier ?? 0;
            return (
              <div key={r.id} onClick={() => setSelected(r)}
                {...tipHandlers(itemTooltipContent(r))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: isSelected ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? VARS.gold : VARS.border}`,
                  borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  opacity: canCraft ? 1 : 0.5, transition: 'all 0.15s',
                }}>
                <ItemIcon name={r.n || r.name} emoji={r.icon} size={28} iconMap={iconMap} type={r.type} tier={t} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: VARS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.n || r.name}</div>
                  <div style={{ fontSize: 10, color: VARS.textDim }}>{r.prof} · {r.type}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: tierColor(t), border: `1px solid ${tierColor(t)}30`, padding: '2px 6px', borderRadius: 4 }}>
                  {tierLabel(t)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Detail Panel */}
        <SuiteCard title={selected ? (selected.n || selected.name) : 'Select a Recipe'}>
          {!selected ? (
            <div style={{ color: VARS.textDim, fontSize: 11 }}>Choose a recipe from the list to begin crafting.</div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 4, borderRadius: 6, border: `1px solid ${tierColor(selected.tier ?? 0)}40`, background: `${tierColor(selected.tier ?? 0)}10` }}>
                  <ItemIcon name={selected.n || selected.name} emoji={selected.icon} size={48} iconMap={iconMap} type={selected.type} tier={selected.tier ?? 0} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: VARS.gold }}>{selected.n || selected.name}</div>
                  <div style={{ fontSize: 11, color: VARS.textDim }}>{selected.desc || selected.description || ''}</div>
                  <div style={{ fontSize: 10, color: tierColor(selected.tier ?? 0), marginTop: 2 }}>{tierLabel(selected.tier ?? 0)} · {selected.prof} · {selected.type}</div>
                </div>
              </div>
              {/* Materials */}
              {selected.mats && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: VARS.textDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Materials</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {Object.entries(selected.mats).map(([mat, qty]) => {
                      const have = resMap[mat] || 0;
                      const enough = have >= qty;
                      return (
                        <div key={mat} {...tipHandlers(`${mat}\nOwned: ${have} / Need: ${qty}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                            background: enough ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${enough ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            borderRadius: 6,
                          }}>
                          <ItemIcon name={mat} size={28} iconMap={iconMap} type="refining" tier={0} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: VARS.text }}>{mat}</div>
                            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: enough ? VARS.green : VARS.red }}>{have}/{qty}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Craft Progress */}
              {crafting && (
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${craftProgress}%`, height: '100%', background: `linear-gradient(90deg, ${VARS.gold}, ${VARS.goldBright})`, borderRadius: 3, transition: 'width 0.05s linear' }} />
                </div>
              )}
              <button
                onClick={() => handleCraft(selected)}
                disabled={!checkCanCraft(selected) || crafting}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: checkCanCraft(selected) && !crafting ? `linear-gradient(135deg, ${VARS.gold}, ${VARS.goldBright})` : 'rgba(255,255,255,0.05)',
                  color: checkCanCraft(selected) && !crafting ? '#000' : VARS.textDim,
                  fontSize: 13, fontWeight: 700, cursor: checkCanCraft(selected) && !crafting ? 'pointer' : 'not-allowed',
                  fontFamily: "'Cinzel', serif", letterSpacing: '0.05em', transition: 'all 0.2s',
                }}
              >
                {crafting ? 'Crafting...' : 'Craft Item'}
              </button>
            </div>
          )}
          {/* Pending Jobs */}
          {pendingJobs.length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${VARS.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: VARS.textDim, marginBottom: 6, textTransform: 'uppercase' }}>Pending Jobs</div>
              {pendingJobs.map(job => {
                const ready = job.completesAt && new Date(job.completesAt).getTime() <= now;
                return (
                  <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <span style={{ fontSize: 11, color: VARS.text }}>{job.recipeName || job.recipeId}</span>
                    {ready ? (
                      <button onClick={() => onClaimJob(job.id)} style={{
                        fontSize: 10, fontWeight: 700, color: VARS.green, background: 'rgba(34,197,94,0.1)',
                        border: `1px solid ${VARS.green}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                      }}>Claim</button>
                    ) : (
                      <span style={{ fontSize: 10, color: VARS.orange }}>Crafting...</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SuiteCard>
      </div>
    </div>
  );
}

// ── Inventory Page ──

function InventoryPage({ suiteInventory, suiteResources, localInventory, iconMap }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Combine suite + local
  const allItems = [];
  (suiteInventory || []).forEach(item => {
    allItems.push({ name: item.name || item.itemId, quantity: item.quantity || 1, tier: item.tier || 1, quality: item.quality, source: 'suite' });
  });
  Object.entries(localInventory || {}).forEach(([name, qty]) => {
    if (!allItems.find(i => i.name === name)) {
      allItems.push({ name, quantity: qty, tier: 0, source: 'local' });
    }
  });

  const resources = (suiteResources || []).map(r => ({
    name: r.resourceType || r.name, quantity: r.quantity, tier: r.tier || 0, source: 'resource',
  }));

  let displayItems = filter === 'resources' ? resources : filter === 'items' ? allItems : [...allItems, ...resources];
  if (search) {
    displayItems = displayItems.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));
  }
  displayItems.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: VARS.gold }}>🎒 Inventory</h2>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{
          flex: 1, minWidth: 180, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${VARS.border}`,
          borderRadius: 6, color: VARS.text, fontSize: 12, fontFamily: 'inherit', outline: 'none',
        }} />
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All ({allItems.length + resources.length})</FilterBtn>
        <FilterBtn active={filter === 'items'} onClick={() => setFilter('items')}>Items ({allItems.length})</FilterBtn>
        <FilterBtn active={filter === 'resources'} onClick={() => setFilter('resources')}>Resources ({resources.length})</FilterBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {displayItems.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: VARS.textDim, padding: 30 }}>No items found</div>}
        {displayItems.map((item, idx) => {
          const t = item.tier || 0;
          const tc = tierColor(t);
          return (
            <div key={`${item.name}-${idx}`}
              {...tipHandlers(`${item.name}\n${tierLabel(t)} · ${item.source === 'resource' ? 'Resource' : 'Item'}\nQuantity: ${item.quantity}${item.quality ? `\nQuality: ${item.quality}` : ''}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${t > 0 ? tc + '40' : VARS.border}`,
                borderRadius: 8,
                boxShadow: t >= 3 ? `0 0 8px ${tc}20` : 'none',
              }}>
              <ItemIcon name={item.name} size={28} iconMap={iconMap} type={item.source === 'resource' ? 'refining' : undefined} tier={t} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: t >= 3 ? tc : VARS.text }}>{item.name}</div>
                {t > 0 && <div style={{ fontSize: 9, color: tc }}>{tierLabel(t)}</div>}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: VARS.gold }}>×{item.quantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Item Database Page ──

function ItemDatabasePage({ iconMap }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${OBJECTSTORE_URL}/api/v1/items-database.json`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items || []);
        setCategories(data.categories || []);
      })
      .catch(() => {});
  }, []);

  let filtered = items;
  if (catFilter !== 'all') filtered = filtered.filter(i => i.category === catFilter);
  if (search) filtered = filtered.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const showing = filtered.slice(0, 200);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: VARS.gold }}>📦 Item Database</h2>
        <span style={{ fontSize: 11, color: VARS.textDim }}>{filtered.length} of {items.length} items</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items by name..." style={{
          flex: 1, minWidth: 180, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${VARS.border}`,
          borderRadius: 6, color: VARS.text, fontSize: 12, fontFamily: 'inherit', outline: 'none',
        }} />
        <FilterBtn active={catFilter === 'all'} onClick={() => setCatFilter('all')}>All</FilterBtn>
        {categories.map(c => <FilterBtn key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{c.charAt(0).toUpperCase() + c.slice(1)}</FilterBtn>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4 }}>
        {showing.map((item, idx) => {
          const statsArr = [];
          if (item.stats?.damage) statsArr.push(`DMG ${item.stats.damage}`);
          if (item.stats?.defense) statsArr.push(`DEF ${item.stats.defense}`);
          if (item.stats?.health) statsArr.push(`HP ${item.stats.health}`);
          if (item.stats?.mana) statsArr.push(`MP ${item.stats.mana}`);
          const tipLines = [item.name, item.category || ''];
          if (statsArr.length) tipLines.push(statsArr.join(' · '));
          if (item.description) tipLines.push(item.description);
          return (
            <div key={idx}
              {...tipHandlers(tipLines.filter(Boolean).join('\n'))}
              style={{
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${VARS.border}`, borderRadius: 8,
                padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'all 0.15s',
                cursor: 'default',
              }}>
              {item.icon ? (
                <img src={item.icon} alt={item.name} style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated', borderRadius: 4, background: 'rgba(0,0,0,0.3)' }} loading="lazy" />
              ) : (
                <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>📦</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: VARS.gold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 9, color: VARS.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{item.category}</div>
                {statsArr.length > 0 && <div style={{ fontSize: 10, color: VARS.textDim, marginTop: 4 }}>{statsArr.join(' · ')}</div>}
              </div>
            </div>
          );
        })}
        {filtered.length > 200 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 12, color: VARS.textDim, fontSize: 11 }}>
            Showing 200 of {filtered.length} — use search to narrow results
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profession Page ──

function ProfessionPage({ profKey, profData, recipes, iconMap }) {
  const prof = PROFESSIONS.find(p => p.key === profKey);
  if (!prof) return null;
  const data = profData[profKey] || {};
  const level = data.level || 1;
  const xp = data.xp || 0;
  const xpNext = data.xpToNext || 100;
  const pct = xpNext > 0 ? (xp / xpNext) * 100 : 0;
  const profRecipes = recipes.filter(r => r.prof === profKey);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: VARS.gold }}>{prof.icon} {profKey}</h2>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: prof.color }}>Level {level} · {xp}/{xpNext} XP</span>
      </div>
      <SuiteCard title="Progression">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <ProfIcon profKey={profKey} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: prof.color }}>{profKey}</div>
            <div style={{ fontSize: 11, color: VARS.textDim }}>{prof.role}</div>
            <XpBar pct={pct} color={prof.color} />
            <div style={{ fontSize: 10, color: VARS.textDim, marginTop: 4 }}>
              Next level: {xpNext - xp} XP needed
            </div>
          </div>
        </div>
      </SuiteCard>
      <SuiteCard title={`${profKey} Recipes (${profRecipes.length})`}>
        {profRecipes.length === 0 ? (
          <div style={{ color: VARS.textDim, fontSize: 11, textAlign: 'center', padding: 10 }}>No recipes for this profession yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {profRecipes.map(r => {
              const t = r.tier ?? 0;
              return (
                <div key={r.id}
                  {...tipHandlers(itemTooltipContent(r))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)', border: `1px solid ${VARS.border}`, borderRadius: 8,
                    cursor: 'default',
                  }}>
                  <ItemIcon name={r.n || r.name} emoji={r.icon} size={24} iconMap={iconMap} type={r.type} tier={t} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: VARS.text }}>{r.n || r.name}</div>
                    <div style={{ fontSize: 10, color: VARS.textDim }}>{r.desc || ''}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tierColor(t) }}>{tierLabel(t)}</span>
                </div>
              );
            })}
          </div>
        )}
      </SuiteCard>
    </div>
  );
}

// ── AFK Harvest Page ──

function AfkHarvestPage() {
  const heroRoster = useGameStore(s => s.heroRoster);
  const activeHeroIds = useGameStore(s => s.activeHeroIds);
  const islandBuildings = useGameStore(s => s.islandBuildings);
  const islandHeroes = useGameStore(s => s.islandHeroes);
  const islandResources = useGameStore(s => s.islandResources);
  const activeHarvests = useGameStore(s => s.activeHarvests);
  const deployHeroToIsland = useGameStore(s => s.deployHeroToIsland);
  const assignHeroToBuilding = useGameStore(s => s.assignHeroToBuilding);
  const collectIslandResources = useGameStore(s => s.collectIslandResources);
  const setScreen = useGameStore(s => s.setScreen);
  const setSuiteInventory = useGameStore(s => s.setSuiteInventory);

  const handleCollect = async () => {
    collectIslandResources();
    // Also sync to server
    const grudgeId = getCurrentGrudgeId();
    if (grudgeId) {
      const heroLevels = {};
      heroRoster.forEach(h => { heroLevels[h.id] = h.level || 1; });
      try {
        await collectHarvest(grudgeId, heroLevels);
        // Refresh inventory from server
        const invResult = await fetchInventory(grudgeId);
        if (invResult.success && setSuiteInventory) {
          setSuiteInventory({ inventory: invResult.inventory || [], resources: invResult.resources || [], currency: invResult.currency || {}, characters: invResult.characters || [] });
        }
      } catch { /* local-only fallback */ }
    }
  };

  const BUILDING_LABELS = {
    mine: { emoji: '⛏️', label: 'Mine', produces: 'ore & stone' },
    lumber: { emoji: '🪓', label: 'Lumber Mill', produces: 'wood' },
    herb: { emoji: '🌿', label: 'Herb Garden', produces: 'herbs' },
    kitchen: { emoji: '🍳', label: 'Kitchen', produces: 'food' },
    workshop: { emoji: '🔧', label: 'Workshop', produces: 'crystals' },
    farm: { emoji: '🌾', label: 'Farm', produces: 'food' },
  };

  // Idle heroes
  const idleHeroes = heroRoster.filter(h => {
    if (activeHeroIds.includes(h.id)) return false;
    if (Object.values(activeHarvests).includes(h.id)) return false;
    if (islandHeroes.some(ih => ih.heroId === h.id)) return false;
    return true;
  });

  // Heroes on island
  const onIsland = islandHeroes.map(ih => {
    const hero = heroRoster.find(h => h.id === ih.heroId);
    const building = ih.buildingId ? islandBuildings.find(b => b.id === ih.buildingId) : null;
    return { ...ih, hero, building };
  }).filter(h => h.hero);

  // Buildings without heroes
  const unassignedBuildings = islandBuildings.filter(b =>
    b.type !== 'camp' && !islandHeroes.some(ih => ih.buildingId === b.id)
  );

  const totalRes = Object.entries(islandResources).reduce((a, [, v]) => a + Math.floor(v), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: VARS.gold }}>🏝️ AFK Harvesting</h2>
        <button onClick={() => setScreen('scene')} style={{
          padding: '6px 14px', borderRadius: 6, border: `1px solid ${VARS.border}`,
          background: 'rgba(212,168,67,0.1)', color: VARS.gold, fontSize: 11, cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600,
        }}>View Island →</button>
      </div>

      {/* Current Harvest Resources */}
      <SuiteCard title="Accumulated Resources">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {Object.entries(islandResources).map(([res, amt]) => (
            <div key={res} style={{ textAlign: 'center', padding: '8px 6px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: VARS.textDim, textTransform: 'uppercase' }}>{res}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: VARS.green, fontFamily: "'JetBrains Mono', monospace" }}>{Math.floor(amt)}</div>
            </div>
          ))}
        </div>
        <button onClick={handleCollect} disabled={totalRes <= 0} style={{
          marginTop: 10, width: '100%', padding: '8px 16px', borderRadius: 6, border: 'none',
          background: totalRes > 0 ? `linear-gradient(135deg, ${VARS.green}, #16a34a)` : 'rgba(255,255,255,0.05)',
          color: totalRes > 0 ? '#fff' : VARS.textDim, fontSize: 12, fontWeight: 700, cursor: totalRes > 0 ? 'pointer' : 'not-allowed',
        }}>Collect All ({totalRes} total)</button>
      </SuiteCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Heroes Harvesting */}
        <SuiteCard title={`Harvesting Heroes (${onIsland.length})`}>
          {onIsland.length === 0 ? (
            <div style={{ color: VARS.textDim, fontSize: 11, textAlign: 'center', padding: 10 }}>No heroes deployed. Deploy idle heroes below.</div>
          ) : (
            onIsland.map(h => {
              const bDef = h.building ? BUILDING_LABELS[h.building.type] : null;
              return (
                <div key={h.heroId} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0',
                  borderBottom: `1px solid ${VARS.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: VARS.text }}>{h.hero.name}</div>
                    <div style={{ fontSize: 10, color: VARS.textDim }}>
                      Lv{h.hero.level} · {bDef ? `${bDef.emoji} ${bDef.label} (${bDef.produces})` : 'Idle on island'}
                    </div>
                  </div>
                  {!h.buildingId && unassignedBuildings.length > 0 && (
                    <select onChange={e => { if (e.target.value) assignHeroToBuilding(h.heroId, e.target.value); }} defaultValue="" style={{
                      fontSize: 10, background: VARS.deep, color: VARS.gold, border: `1px solid ${VARS.border}`,
                      borderRadius: 4, padding: '2px 6px', cursor: 'pointer',
                    }}>
                      <option value="">Assign...</option>
                      {unassignedBuildings.map(b => {
                        const def = BUILDING_LABELS[b.type];
                        return <option key={b.id} value={b.id}>{def?.emoji} {def?.label || b.type}</option>;
                      })}
                    </select>
                  )}
                </div>
              );
            })
          )}
        </SuiteCard>

        {/* Idle Heroes Available to Deploy */}
        <SuiteCard title={`Idle Heroes (${idleHeroes.length})`}>
          {idleHeroes.length === 0 ? (
            <div style={{ color: VARS.textDim, fontSize: 11, textAlign: 'center', padding: 10 }}>All heroes are deployed or in party.</div>
          ) : (
            idleHeroes.map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: `1px solid ${VARS.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: VARS.text }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: VARS.textDim }}>Lv{h.level} · {h.classId || h.playerClass || 'Adventurer'}</div>
                </div>
                <button onClick={() => deployHeroToIsland(h.id)} style={{
                  fontSize: 10, fontWeight: 700, color: VARS.green, background: 'rgba(34,197,94,0.1)',
                  border: `1px solid ${VARS.green}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
                }}>Deploy</button>
              </div>
            ))
          )}
        </SuiteCard>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN CRAFTING SUITE PAGE
// ══════════════════════════════════════════

export default function CraftingSuitePage() {
  const setScreen = useGameStore(s => s.setScreen);
  const suiteLinked = useGameStore(s => s.suiteLinked);
  const suiteResources = useGameStore(s => s.suiteResources);
  const suiteInventory = useGameStore(s => s.suiteInventory);
  const suiteCraftingJobs = useGameStore(s => s.suiteCraftingJobs);
  const suiteProfessions = useGameStore(s => s.suiteProfessions);
  const suiteGold = useGameStore(s => s.suiteGold);
  const setSuiteInventory = useGameStore(s => s.setSuiteInventory);
  const setSuiteRecipes = useGameStore(s => s.setSuiteRecipes);
  const setSuiteCraftingJobs = useGameStore(s => s.setSuiteCraftingJobs);
  const setSuiteProfessions = useGameStore(s => s.setSuiteProfessions);

  const [page, setPage] = useState('dashboard');
  const [serverRecipes, setServerRecipes] = useState([]);
  const [log, setLog] = useState([]);
  const [suiteStatus, setSuiteStatus] = useState({ connected: false, latencyMs: 0 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const iconMap = useItemIconMap();

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setSidebarOpen(!e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const grudgeId = getCurrentGrudgeId();
  const hasAuth = hasCraftingAuth();

  const addLogEntry = useCallback((msg, type = '') => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setLog(prev => [{ time, msg, type }, ...prev.slice(0, 99)]);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        // Check suite connectivity
        const status = await fetchSuiteStatus();
        if (!cancelled) setSuiteStatus(status);

        // Fetch recipes
        const recipesResult = await fetchRecipes();
        if (!cancelled && recipesResult.success) {
          const srv = (recipesResult.recipes || []).map(r => ({
            id: r.id || r.recipe_id,
            n: r.name,
            name: r.name,
            prof: r.profession || 'All',
            type: r.category || 'other',
            tier: r.tier || 0,
            icon: r.icon || '📦',
            mats: r.ingredients ? Object.fromEntries((r.ingredients || []).map(i => [i.name || i.itemId, i.quantity || 1])) : {},
            desc: r.description || '',
          }));
          setServerRecipes(srv);
          if (setSuiteRecipes) setSuiteRecipes(recipesResult.recipes || []);
        }

        // Fetch inventory
        if (grudgeId) {
          const invResult = await fetchInventory(grudgeId);
          if (!cancelled && invResult.success && setSuiteInventory) {
            setSuiteInventory({
              inventory: invResult.inventory || [],
              resources: invResult.resources || [],
              currency: invResult.currency || {},
              characters: invResult.characters || [],
            });
          }

          // Fetch crafting jobs
          const jobsResult = await fetchCraftingJobs(grudgeId);
          if (!cancelled && jobsResult.success && setSuiteCraftingJobs) {
            setSuiteCraftingJobs(jobsResult.jobs || []);
          }

          // Fetch professions
          const profResult = await fetchProfessions(grudgeId);
          if (!cancelled && profResult.success && setSuiteProfessions) {
            setSuiteProfessions(profResult);
          }
        }
      } catch (err) {
        console.error('[CraftingSuite] Load error:', err);
      }
      if (!cancelled) setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [grudgeId]);

  // Merge recipes: server overrides local by id
  const mergedRecipes = (() => {
    const byId = {};
    LOCAL_RECIPES.forEach(r => { byId[r.id] = r; });
    serverRecipes.forEach(r => { byId[r.id] = r; });
    return Object.values(byId);
  })();

  // Build profession data from suiteProfessions (flatten first character's data)
  const profData = (() => {
    const entries = Object.entries(suiteProfessions || {});
    if (entries.length === 0) {
      // Fallback: show default levels
      const result = {};
      PROFESSIONS.forEach(p => { result[p.key] = { level: 1, xp: 0, xpToNext: 100 }; });
      return result;
    }
    // Merge all characters' professions (take highest level per prof)
    const result = {};
    entries.forEach(([, profs]) => {
      Object.entries(profs || {}).forEach(([name, data]) => {
        if (!result[name] || (data.level || 0) > (result[name].level || 0)) {
          result[name] = data;
        }
      });
    });
    return result;
  })();

  // Build local inventory from gameStore harvestResources
  const harvestResources = useGameStore(s => s.harvestResources);
  const inventory = useGameStore(s => s.inventory);
  const localInventory = {};
  Object.entries(harvestResources || {}).forEach(([k, v]) => { if (v > 0) localInventory[k] = Math.floor(v); });
  (inventory || []).forEach(item => { localInventory[item.itemKey || item.name] = (localInventory[item.itemKey || item.name] || 0) + (item.quantity || 1); });

  const handleCraft = async (recipe) => {
    addLogEntry(`🔨 Crafted ${recipe.n || recipe.name}`, 'craft');
    // If we have a grudge ID, submit to server
    if (grudgeId && recipe.id) {
      try {
        const result = await submitCraft({ grudgeId, characterId: null, recipeId: recipe.id, quantity: 1, tier: recipe.tier || 1 });
        if (result.success) {
          addLogEntry(`✓ Server craft job started`, 'success');
          // Refresh jobs
          const jobsResult = await fetchCraftingJobs(grudgeId);
          if (jobsResult.success) setSuiteCraftingJobs(jobsResult.jobs || []);
        }
      } catch { /* client-only fallback */ }
    }
  };

  const handleClaimJob = async (jobId) => {
    if (!grudgeId) return;
    try {
      const result = await claimCraft(grudgeId, jobId);
      if (result.success) {
        addLogEntry(`✓ Claimed crafted items!`, 'success');
        // Refresh inventory + jobs
        const [invResult, jobsResult] = await Promise.all([
          fetchInventory(grudgeId),
          fetchCraftingJobs(grudgeId),
        ]);
        if (invResult.success) setSuiteInventory({ inventory: invResult.inventory || [], resources: invResult.resources || [], currency: invResult.currency || {}, characters: invResult.characters || [] });
        if (jobsResult.success) setSuiteCraftingJobs(jobsResult.jobs || []);
      }
    } catch { addLogEntry('✗ Claim failed', 'error'); }
  };

  // Nav items
  const navItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'crafting', icon: '🔨', label: 'Crafting Bench' },
    { key: 'inventory', icon: '🎒', label: 'Inventory', badge: (suiteInventory || []).length },
    { key: 'afk-harvest', icon: '🏝️', label: 'AFK Harvest' },
    { key: 'item-database', icon: '📦', label: 'Item Database' },
  ];

  const profNavItems = PROFESSIONS.map(p => ({
    key: `prof-${p.key.toLowerCase()}`,
    icon: p.icon,
    label: p.key,
    badge: (profData[p.key]?.level || 1),
  }));

  const renderPage = () => {
    if (loading) {
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: VARS.textDim }}>Loading crafting data...</div>;
    }
    switch (page) {
      case 'dashboard':
        return <DashboardPage recipes={mergedRecipes} suiteInventory={suiteInventory} suiteResources={suiteResources} profData={profData} jobs={suiteCraftingJobs || []} log={log} iconMap={iconMap} />;
      case 'crafting':
        return <CraftingBenchPage recipes={mergedRecipes} inventory={localInventory} resources={suiteResources} suiteGold={suiteGold} grudgeId={grudgeId} jobs={suiteCraftingJobs || []} onCraft={handleCraft} onClaimJob={handleClaimJob} iconMap={iconMap} addLog={addLogEntry} />;
      case 'inventory':
        return <InventoryPage suiteInventory={suiteInventory} suiteResources={suiteResources} localInventory={localInventory} iconMap={iconMap} />;
      case 'afk-harvest':
        return <AfkHarvestPage />;
      case 'item-database':
        return <ItemDatabasePage iconMap={iconMap} />;
      default:
        if (page.startsWith('prof-')) {
          const profKey = page.replace('prof-', '');
          const prof = PROFESSIONS.find(p => p.key.toLowerCase() === profKey);
          if (prof) return <ProfessionPage profKey={prof.key} profData={profData} recipes={mergedRecipes} iconMap={iconMap} />;
        }
        return <DashboardPage recipes={mergedRecipes} suiteInventory={suiteInventory} suiteResources={suiteResources} profData={profData} jobs={suiteCraftingJobs || []} log={log} iconMap={iconMap} />;
    }
  };

  const handleNavClick = (key) => {
    setPage(key);
    // Auto-close sidebar on mobile after nav
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', fontFamily: "'Inter', sans-serif", fontSize: 13, color: VARS.text, background: VARS.deep, position: 'relative' }}>
      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(o => !o)} style={{
        display: sidebarOpen ? 'none' : 'flex',
        position: 'absolute', top: 10, left: 10, zIndex: 20,
        width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        background: VARS.deep2, border: `1px solid ${VARS.border}`,
        color: VARS.gold, fontSize: 18, cursor: 'pointer',
      }}>☰</button>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? sidebarW : 0,
        minWidth: sidebarOpen ? sidebarW : 0,
        background: VARS.deep2, borderRight: sidebarOpen ? `1px solid ${VARS.border}` : 'none',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
        overflowX: 'hidden', transition: 'width 0.2s ease, min-width 0.2s ease',
        position: window.innerWidth <= 768 && sidebarOpen ? 'absolute' : 'relative',
        zIndex: 15, height: '100%',
        boxShadow: window.innerWidth <= 768 && sidebarOpen ? '4px 0 16px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${VARS.border}`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: VARS.gold, letterSpacing: '0.05em' }}>⚔ Grudge Crafting</div>
            <div style={{ fontSize: 9, color: VARS.textDim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Warlord Profession Suite</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{
            background: 'none', border: 'none', color: VARS.textDim, fontSize: 16, cursor: 'pointer',
            padding: '4px 6px', display: window.innerWidth <= 768 ? 'block' : 'none',
          }}>✕</button>
        </div>

        {/* Navigation */}
        <div style={{ padding: '8px 0', borderBottom: `1px solid ${VARS.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: VARS.textDim, padding: '4px 16px 6px' }}>Navigation</div>
          {navItems.map(item => (
            <button key={item.key} onClick={() => handleNavClick(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: page === item.key ? 'rgba(212,168,67,0.12)' : 'none',
              border: 'none', borderLeft: page === item.key ? `2px solid ${VARS.gold}` : '2px solid transparent',
              color: page === item.key ? VARS.gold : VARS.textDim, fontSize: 12, fontFamily: 'inherit',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto', fontSize: 9, padding: '1px 6px', borderRadius: 8,
                  background: 'rgba(212,168,67,0.15)', color: VARS.gold, fontFamily: "'JetBrains Mono', monospace",
                }}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Professions */}
        <div style={{ padding: '8px 0', borderBottom: `1px solid ${VARS.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: VARS.textDim, padding: '4px 16px 6px' }}>Professions</div>
          {profNavItems.map(item => (
            <button key={item.key} onClick={() => handleNavClick(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: page === item.key ? 'rgba(212,168,67,0.12)' : 'none',
              border: 'none', borderLeft: page === item.key ? `2px solid ${VARS.gold}` : '2px solid transparent',
              color: page === item.key ? VARS.gold : VARS.textDim, fontSize: 12, fontFamily: 'inherit',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              <span style={{
                marginLeft: 'auto', fontSize: 9, padding: '1px 6px', borderRadius: 8,
                background: 'rgba(212,168,67,0.15)', color: VARS.gold, fontFamily: "'JetBrains Mono', monospace",
              }}>{item.badge}</span>
            </button>
          ))}
        </div>

        {/* Back to Game */}
        <div style={{ padding: '8px 0' }}>
          <button onClick={() => setScreen('world')} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: 'none', border: 'none', color: VARS.textDim, fontSize: 12, fontFamily: 'inherit',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🌐</span>
            <span>Back to World Map</span>
          </button>
          <button onClick={() => setScreen('lobby')} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: 'none', border: 'none', color: VARS.textDim, fontSize: 12, fontFamily: 'inherit',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🏠</span>
            <span>Back to War Room</span>
          </button>
        </div>

        {/* Status */}
        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: `1px solid ${VARS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: suiteStatus.connected ? VARS.green : '#444',
            boxShadow: suiteStatus.connected ? `0 0 6px ${VARS.green}` : 'none',
          }} />
          <span style={{ fontSize: 11, color: VARS.textDim }}>
            {suiteStatus.connected ? `Suite Online (${suiteStatus.latencyMs}ms)` : 'Suite Offline'}
          </span>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {window.innerWidth <= 768 && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'absolute', inset: 0, zIndex: 14,
          background: 'rgba(0,0,0,0.5)',
        }} />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '100%', padding: sidebarOpen && window.innerWidth <= 768 ? '24px 16px' : 24 }}>
        {renderPage()}
      </div>
    </div>
  );
}
