import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, SCENE_NPCS } from '../data/spriteMap';
import { TIERS, EQUIPMENT_SLOTS, getSellPrice } from '../data/equipment';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import NpcSprite from './NpcSprite';
import BubbleEmitter from './BubbleEmitter';
import ReefHuntMiniGame from './ReefHuntMiniGame';
import useIsMobile from '../hooks/useIsMobile';

const RESOURCE_NODES = [
  { id: 'gold_mine', name: 'Pearl Beds', icon: 'pickaxe', resource: 'gold', x: 18, y: 30, color: '#fbbf24', img: '/images/buildings/pearl_beds.png' },
  { id: 'herb_garden', name: 'Algae Garden', icon: 'nature', resource: 'herbs', x: 72, y: 28, color: '#4ade80', img: '/images/buildings/algae_garden.png' },
  { id: 'lumber_yard', name: 'Root Grove', icon: 'wood', resource: 'wood', x: 12, y: 58, color: '#22d3ee', img: '/images/buildings/coral_grove.png' },
  { id: 'ore_vein', name: 'Shell Deposit', icon: 'ore', resource: 'ore', x: 80, y: 55, color: '#94a3b8', img: '/images/buildings/shell_deposit.png' },
  { id: 'crystal_cave', name: 'Crystal Grotto', icon: 'diamond', resource: 'crystals', x: 50, y: 22, color: '#a78bfa', img: '/images/buildings/crystal_grotto.png' },
];

const REST_NODE = { id: 'rest_spot', name: 'Rest', x: 35, y: 55, color: '#818cf8', img: '/images/buildings/sleeping_bag.png' };
const CHEST_NODE = { id: 'inventory_chest', name: 'Inventory', x: 90, y: 48, color: '#f59e0b', img: '/images/buildings/treasure_chest.png' };
const REEF_HUNT_NODE = { id: 'reef_hunt', name: 'Grove Hunt', x: 55, y: 35, color: '#22d3ee', img: '/images/buildings/crystal_grotto.png' };

const SELL_PRICES = { gold: 1, herbs: 2, wood: 2, ore: 4, crystals: 8 };
const RESOURCE_LABELS = { gold: 'Pearls', herbs: 'Algae', wood: 'Root', ore: 'Shells', crystals: 'Crystals' };

const SPAWN_POS = { x: 50, y: -8 };
const LAND_POS = { x: 45, y: 75 };

const NPC_EDGES = [
  { from: 'left', x: -10, y: null },
  { from: 'right', x: 110, y: null },
  { from: 'top', x: null, y: -10 },
];

const SLOT_LABELS = {
  weapon: 'Weapon', offhand: 'Off-Hand', helmet: 'Helmet',
  armor: 'Armor', feet: 'Feet', ring: 'Ring', relic: 'Relic',
};

export default function CampScene() {
  const isMobile = useIsMobile();
  useEffect(() => { setBgm('scene'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const harvestResources = useGameStore(s => s.harvestResources);
  const harvestNodes = useGameStore(s => s.harvestNodes);
  const activeHarvests = useGameStore(s => s.activeHarvests);
  const heroRoster = useGameStore(s => s.heroRoster);
  const activeHeroIds = useGameStore(s => s.activeHeroIds);
  const assignHarvest = useGameStore(s => s.assignHarvest);
  const recallHarvest = useGameStore(s => s.recallHarvest);
  const sellResource = useGameStore(s => s.sellResource);
  const gold = useGameStore(s => s.gold);
  const level = useGameStore(s => s.level);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const tickHarvests = useGameStore(s => s.tickHarvests);
  const playerHealth = useGameStore(s => s.playerHealth);
  const playerMaxHealth = useGameStore(s => s.playerMaxHealth);
  const restAtCamp = useGameStore(s => s.restAtCamp);
  const inventory = useGameStore(s => s.inventory);
  const equipItem = useGameStore(s => s.equipItem);
  const unequipItem = useGameStore(s => s.unequipItem);
  const removeFromInventory = useGameStore(s => s.removeFromInventory);
  const sellItem = useGameStore(s => s.sellItem);
  const addForageRewards = useGameStore(s => s.addForageRewards);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showSellPanel, setShowSellPanel] = useState(false);
  const [showRestPanel, setShowRestPanel] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showReefHunt, setShowReefHunt] = useState(false);
  const [resting, setResting] = useState(false);
  const [restDone, setRestDone] = useState(false);
  const [invTab, setInvTab] = useState('items');
  const [selectedInvItem, setSelectedInvItem] = useState(null);
  const [selectedEquipHero, setSelectedEquipHero] = useState(null);
  const [heroX, setHeroX] = useState(SPAWN_POS.x);
  const [heroY, setHeroY] = useState(SPAWN_POS.y);
  const [heroScale, setHeroScale] = useState(0.3);
  const [walking, setWalking] = useState(true);
  const [facingLeft, setFacingLeft] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [entering, setEntering] = useState(true);
  const [npcVisible, setNpcVisible] = useState({});
  const [npcPositions, setNpcPositions] = useState({});
  const walkTimeout = useRef(null);
  const exitTimeout = useRef(null);
  const sceneRef = useRef(null);
  const mountedRef = useRef(true);
  const npcTimers = useRef([]);

  React.useEffect(() => {
    const interval = setInterval(() => tickHarvests(), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (walkTimeout.current) clearTimeout(walkTimeout.current);
      if (exitTimeout.current) clearTimeout(exitTimeout.current);
      npcTimers.current.forEach(t => clearTimeout(t));
      npcTimers.current = [];
    };
  }, []);

  useEffect(() => {
    const npcs = SCENE_NPCS.camp || [];
    const entranceStagger = {};
    npcs.forEach((npc, i) => {
      const edge = NPC_EDGES[i % NPC_EDGES.length];
      const startX = edge.x !== null ? edge.x : npc.x;
      const startY = edge.y !== null ? edge.y : npc.y;
      entranceStagger[npc.id] = { startX, startY, delay: 800 + i * 400 };
    });
    setNpcPositions(
      Object.fromEntries(npcs.map(npc => {
        const e = entranceStagger[npc.id];
        return [npc.id, { x: e.startX, y: e.startY, scale: 0.3 }];
      }))
    );

    npcs.forEach(npc => {
      const e = entranceStagger[npc.id];
      const t1 = setTimeout(() => {
        if (!mountedRef.current) return;
        setNpcPositions(prev => ({ ...prev, [npc.id]: { x: npc.x, y: npc.y, scale: 1 } }));
        const t2 = setTimeout(() => {
          if (!mountedRef.current) return;
          setNpcVisible(prev => ({ ...prev, [npc.id]: true }));
        }, 800);
        npcTimers.current.push(t2);
      }, e.delay);
      npcTimers.current.push(t1);
    });
  }, []);

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setHeroX(LAND_POS.x);
      setHeroY(LAND_POS.y);
      setHeroScale(1);
    }, 100);
    const landTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setWalking(false);
      setEntering(false);
    }, 1200);
    return () => { clearTimeout(enterTimer); clearTimeout(landTimer); };
  }, []);

  const availableHeroes = heroRoster.filter(h => {
    const isHarvesting = Object.values(activeHarvests).includes(h.id);
    return !isHarvesting;
  });

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    if (exiting || entering) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(5, Math.min(95, pctX));
    const clampedY = Math.max(10, Math.min(88, pctY));
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    setFacingLeft(clampedX < heroX);
    setWalking(true);
    setHeroX(clampedX);
    setHeroY(clampedY);
    setSelectedNode(null);
    walkTimeout.current = setTimeout(() => {
      setWalking(false);
    }, 600);
  }, [exiting, entering, heroX]);

  const walkToNode = (node) => {
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    const targetX = node.x - 6;
    const targetY = node.y + 8;
    setFacingLeft(targetX < heroX);
    setWalking(true);
    setHeroX(targetX);
    setHeroY(targetY);
    walkTimeout.current = setTimeout(() => {
      setWalking(false);
      setSelectedNode(node.id);
    }, 600);
  };

  const handleExit = () => {
    if (exiting || entering) return;
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    setExiting(true);
    setSelectedNode(null);
    setShowSellPanel(false);
    setShowRestPanel(false);
    setShowInventory(false);
    setFacingLeft(heroX > 50);
    setWalking(true);
    setHeroX(50);
    setHeroY(-5);
    let scaleStep = 0;
    const shrinkInterval = setInterval(() => {
      scaleStep++;
      const progress = Math.min(scaleStep / 20, 1);
      setHeroScale(1 - progress * 0.7);
      if (progress >= 1) clearInterval(shrinkInterval);
    }, 50);

    npcTimers.current.forEach(t => clearTimeout(t));
    npcTimers.current = [];
    const npcs = SCENE_NPCS.camp || [];
    npcs.forEach((npc, i) => {
      const edge = NPC_EDGES[i % NPC_EDGES.length];
      const t = setTimeout(() => {
        if (!mountedRef.current) return;
        setNpcPositions(prev => ({
          ...prev,
          [npc.id]: {
            x: edge.x !== null ? edge.x : npc.x,
            y: edge.y !== null ? edge.y : npc.y,
            scale: 0.3,
          }
        }));
      }, i * 150);
      npcTimers.current.push(t);
    });

    exitTimeout.current = setTimeout(() => {
      clearInterval(shrinkInterval);
      exitScene();
    }, 1000);
  };

  const handleNodeClick = (node) => {
    if (exiting || entering) return;
    if (selectedNode === node.id) {
      setSelectedNode(null);
      return;
    }
    walkToNode(node);
  };

  const handleRestClick = () => {
    if (exiting || entering) return;
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    setFacingLeft(REST_NODE.x < heroX);
    setWalking(true);
    setHeroX(REST_NODE.x - 6);
    setHeroY(REST_NODE.y + 8);
    setSelectedNode(null);
    setShowInventory(false);
    walkTimeout.current = setTimeout(() => {
      setWalking(false);
      setShowRestPanel(true);
    }, 600);
  };

  const handleChestClick = () => {
    if (exiting || entering) return;
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    setFacingLeft(CHEST_NODE.x < heroX);
    setWalking(true);
    setHeroX(CHEST_NODE.x - 6);
    setHeroY(CHEST_NODE.y + 8);
    setSelectedNode(null);
    setShowRestPanel(false);
    walkTimeout.current = setTimeout(() => {
      setWalking(false);
      setShowInventory(true);
      setSelectedInvItem(null);
      setSelectedEquipHero(null);
    }, 600);
  };

  const handleReefHuntClick = () => {
    if (exiting || entering) return;
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    setFacingLeft(REEF_HUNT_NODE.x < heroX);
    setWalking(true);
    setHeroX(REEF_HUNT_NODE.x - 6);
    setHeroY(REEF_HUNT_NODE.y + 8);
    setSelectedNode(null);
    setShowRestPanel(false);
    setShowInventory(false);
    walkTimeout.current = setTimeout(() => {
      setWalking(false);
      setShowReefHunt(true);
    }, 600);
  };

  const handleReefHuntComplete = (results) => {
    if (results && results.resources) {
      addForageRewards(results.resources, results.buffs || []);
    }
  };

  const doRest = () => {
    setResting(true);
    setRestDone(false);
    setTimeout(() => {
      if (!mountedRef.current) return;
      restAtCamp();
      setResting(false);
      setRestDone(true);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setRestDone(false);
      }, 2000);
    }, 1500);
  };

  const hpPct = playerMaxHealth > 0 ? Math.round((playerHealth / playerMaxHealth) * 100) : 100;
  const allFullHp = heroRoster.every(h => h.currentHealth >= (h.maxHealth || h.currentHealth));
  const partyFullHp = allFullHp && playerHealth >= playerMaxHealth;

  const equipItems = inventory.filter(i => i.slot && !i.consumable);
  const consumableItems = inventory.filter(i => i.consumable);

  const nodeSize = isMobile ? 56 : 72;
  const nodeImgSize = isMobile ? 44 : 60;

  const renderInteractiveNode = (node, onClick) => (
    <div key={node.id} onClick={onClick} style={{
      position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
      transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 15,
      textAlign: 'center',
    }}>
      <div style={{
        width: nodeSize, height: nodeSize, borderRadius: 10,
        background: `radial-gradient(circle, ${node.color}25, rgba(0,0,0,0.3))`,
        border: `2px solid ${node.color}80`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${node.color}40, inset 0 0 20px rgba(0,0,0,0.3)`,
        overflow: 'hidden',
        minWidth: 36, minHeight: 36,
      }}>
        <img src={node.img} alt={node.name} style={{ width: nodeImgSize, height: nodeImgSize, objectFit: 'contain', imageRendering: 'auto' }} />
      </div>
      <div className="font-cinzel" style={{
        color: node.color, fontSize: isMobile ? '0.65rem' : '0.85rem', fontWeight: 700, marginTop: 4,
        textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${node.color}40`,
        whiteSpace: 'nowrap',
      }}>
        {node.name}
      </div>
    </div>
  );

  return (
    <div
      ref={sceneRef}
      onContextMenu={handleRightClick}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_camp_ocean.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />

      <BubbleEmitter
        ambient={3}
        density={0.5}
        sources={[
          ...(SCENE_NPCS.camp || []).map(npc => ({
            id: `npc_${npc.id}`, x: npc.x, y: npc.y, rate: 0.3,
            minSize: 2, maxSize: 5,
          })),
          ...RESOURCE_NODES.map(n => ({
            id: `res_${n.id}`, x: n.x, y: n.y, rate: 0.6,
            minSize: 3, maxSize: 8, color: n.color + '60',
          })),
          { id: 'exit_portal', x: 50, y: 90, rate: 0.8, minSize: 2, maxSize: 6, color: 'rgba(110,231,183,0.4)' },
        ]}
      />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 20,
      }}>
        <div className="font-cinzel" style={{ color: '#4ade80', fontSize: '0.9rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          Camp
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {gold} Pearls
          </span>
          <button onClick={() => setShowSellPanel(!showSellPanel)} style={{
            background: 'rgba(0,0,0,0.6)', border: '1px solid #fbbf24', borderRadius: 8,
            padding: isMobile ? '8px 12px' : '4px 12px', color: '#fbbf24', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
            backdropFilter: 'blur(4px)',
            minHeight: isMobile ? 36 : 'auto',
          }}>Sell Resources</button>
        </div>
      </div>

      {primarySprite && (
        <div style={{
          position: 'absolute', left: `${heroX}%`, top: `${heroY}%`,
          transform: `translate(-50%, -50%) scale(${heroScale})`,
          zIndex: 10,
          transition: entering
            ? 'left 1s ease-out, top 1s ease-out, transform 1s ease-out'
            : exiting
              ? 'left 1s ease-in, top 1s ease-in'
              : 'left 0.6s ease, top 0.6s ease',
          opacity: heroScale < 0.35 ? 0 : 1,
        }}>
          <SpriteAnimation
            spriteData={primarySprite}
            animation={walking ? 'walk' : 'idle'}
            scale={3}
            flip={facingLeft}
          />
        </div>
      )}

      {RESOURCE_NODES.map(node => {
        const storeNode = harvestNodes.find(n => n.id === node.id);
        if (!storeNode || level < storeNode.unlockLevel) return null;
        const assignedHeroId = activeHarvests[node.id];
        const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
        const resourceAmount = Math.floor(harvestResources[node.resource] || 0);

        return (
          <div key={node.id} onClick={() => handleNodeClick(node)} style={{
            position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
            transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 15,
            textAlign: 'center',
          }}>
            <div style={{
              width: nodeSize, height: nodeSize, borderRadius: 10,
              background: `radial-gradient(circle, ${node.color}25, rgba(0,0,0,0.3))`,
              border: `2px solid ${node.color}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px ${node.color}40, inset 0 0 20px rgba(0,0,0,0.3)`,
              animation: assignedHero ? 'pulse 2s infinite' : 'none',
              overflow: 'hidden',
              minWidth: 36, minHeight: 36,
            }}>
              <img src={node.img} alt={node.name} style={{ width: nodeImgSize, height: nodeImgSize, objectFit: 'contain', imageRendering: 'auto' }} />
            </div>
            <div className="font-cinzel" style={{
              color: node.color, fontSize: isMobile ? '0.65rem' : '0.85rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${node.color}40`,
              whiteSpace: 'nowrap',
            }}>
              {node.name}
            </div>
            {resourceAmount > 0 && (
              <div style={{
                color: '#fff', fontSize: '0.45rem', fontWeight: 600,
                background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 4px',
                marginTop: 1,
              }}>
                {resourceAmount}
              </div>
            )}
            {assignedHero && (
              <div style={{
                color: '#6ee7b3', fontSize: '0.4rem', fontWeight: 600, marginTop: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {assignedHero.name}
              </div>
            )}

            {selectedNode === node.id && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(10,15,30,0.95)', border: `1px solid ${node.color}`,
                borderRadius: 8, padding: 8, minWidth: 120, marginTop: 4,
                backdropFilter: 'blur(8px)', zIndex: 30,
              }} onClick={e => e.stopPropagation()}>
                {assignedHero ? (
                  <div>
                    <div style={{ color: '#6ee7b3', fontSize: '0.55rem', marginBottom: 4 }}>
                      {assignedHero.name} harvesting
                    </div>
                    <button onClick={() => recallHarvest(node.id)} style={{
                      width: '100%', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                      borderRadius: 6, padding: isMobile ? '8px' : '3px 8px', color: '#ef4444', cursor: 'pointer',
                      fontSize: isMobile ? '0.55rem' : '0.5rem', fontWeight: 700,
                      minHeight: isMobile ? 36 : 'auto',
                    }}>Recall</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.5rem', marginBottom: 4 }}>Assign Hero:</div>
                    {availableHeroes.length === 0 ? (
                      <div style={{ color: '#666', fontSize: '0.45rem' }}>No heroes available</div>
                    ) : (
                      availableHeroes.map(hero => (
                        <button key={hero.id} onClick={() => { assignHarvest(node.id, hero.id); setSelectedNode(null); }} style={{
                          width: '100%', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)',
                          borderRadius: 4, padding: isMobile ? '6px' : '2px 6px', color: '#6ee7b3', cursor: 'pointer',
                          fontSize: isMobile ? '0.55rem' : '0.5rem', fontWeight: 600, marginBottom: 2, textAlign: 'left',
                          minHeight: isMobile ? 36 : 'auto',
                        }}>
                          {hero.name} (Lv{hero.level})
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {renderInteractiveNode(REST_NODE, handleRestClick)}
      {renderInteractiveNode(CHEST_NODE, handleChestClick)}
      {renderInteractiveNode(REEF_HUNT_NODE, handleReefHuntClick)}

      {showRestPanel && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10,15,30,0.95)', border: '2px solid #818cf8',
          borderRadius: 12, padding: isMobile ? 12 : 16, minWidth: isMobile ? 200 : 240, zIndex: 50,
          backdropFilter: 'blur(8px)',
          maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none',
          width: isMobile ? '90%' : 'auto',
        }} onClick={e => e.stopPropagation()}>
          <div className="font-cinzel" style={{ color: '#818cf8', fontSize: '0.85rem', marginBottom: 10, textAlign: 'center' }}>
            Rest
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#e2e8f0', fontSize: '0.6rem' }}>Your Health</span>
              <span style={{ color: hpPct >= 100 ? '#4ade80' : '#fbbf24', fontSize: '0.6rem', fontWeight: 700 }}>
                {playerHealth}/{playerMaxHealth}
              </span>
            </div>
            <div style={{
              width: '100%', height: 8, borderRadius: 4,
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${hpPct}%`, height: '100%', borderRadius: 4,
                background: hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {heroRoster.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.55rem', marginBottom: 4 }}>Party Health:</div>
              {heroRoster.map(h => {
                const hp = h.currentHealth || 0;
                const maxHp = h.maxHealth || hp || 1;
                const pct = Math.round((hp / maxHp) * 100);
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ color: '#e2e8f0', fontSize: '0.5rem', width: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.name}
                    </span>
                    <div style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 3,
                        background: pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.45rem', minWidth: 40, textAlign: 'right' }}>
                      {hp}/{maxHp}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {resting ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ color: '#818cf8', fontSize: '0.7rem', animation: 'pulse 1s infinite' }}>
                Resting...
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.5rem', marginTop: 4 }}>
                💤 Recovering health...
              </div>
            </div>
          ) : restDone ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 700 }}>
                Fully Rested!
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.5rem', marginTop: 4 }}>
                All heroes restored to full health
              </div>
            </div>
          ) : (
            <button onClick={doRest} disabled={partyFullHp} style={{
              width: '100%',
              background: partyFullHp ? 'rgba(50,50,50,0.3)' : 'rgba(129,140,248,0.2)',
              border: `1px solid ${partyFullHp ? '#555' : '#818cf8'}`,
              borderRadius: 8, padding: isMobile ? '10px 0' : '6px 0',
              color: partyFullHp ? '#666' : '#818cf8',
              cursor: partyFullHp ? 'default' : 'pointer',
              fontSize: '0.65rem', fontWeight: 700,
              minHeight: isMobile ? 36 : 'auto',
            }}>
              {partyFullHp ? 'Already at Full Health' : 'Rest & Heal All'}
            </button>
          )}

          <button onClick={() => setShowRestPanel(false)} style={{
            width: '100%', background: 'rgba(100,100,100,0.2)', border: '1px solid #555',
            borderRadius: 6, padding: '4px 0', color: '#aaa', cursor: 'pointer',
            fontSize: '0.55rem', marginTop: 8,
          }}>Close</button>
        </div>
      )}

      {showInventory && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '2%' : '5%',
          right: isMobile ? '2%' : '3%',
          bottom: isMobile ? '8%' : '12%',
          left: isMobile ? '2%' : 'auto',
          width: isMobile ? 'auto' : '52%',
          maxWidth: isMobile ? 'calc(100vw - 16px)' : 340,
          background: 'rgba(10,15,30,0.96)', border: '2px solid #f59e0b',
          borderRadius: 12, zIndex: 50,
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            padding: '8px 12px', borderBottom: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="font-cinzel" style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
              Inventory
            </div>
            <button onClick={() => setShowInventory(false)} style={{
              background: 'none', border: 'none', color: '#aaa', cursor: 'pointer',
              fontSize: '0.9rem', lineHeight: 1,
            }}>✕</button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[{ key: 'items', label: `Equipment (${equipItems.length})` }, { key: 'consumables', label: `Consumables (${consumableItems.length})` }].map(tab => (
              <button key={tab.key} onClick={() => { setInvTab(tab.key); setSelectedInvItem(null); }} style={{
                flex: 1, padding: '6px 0',
                background: invTab === tab.key ? 'rgba(245,158,11,0.15)' : 'transparent',
                border: 'none', borderBottom: invTab === tab.key ? '2px solid #f59e0b' : '2px solid transparent',
                color: invTab === tab.key ? '#f59e0b' : '#94a3b8',
                cursor: 'pointer', fontSize: '0.55rem', fontWeight: 600,
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {invTab === 'items' ? (
              equipItems.length === 0 ? (
                <div style={{ color: '#555', fontSize: '0.55rem', textAlign: 'center', padding: 16 }}>
                  No equipment in inventory
                </div>
              ) : (
                equipItems.map(item => {
                  const tierDef = TIERS[item.tier] || TIERS[1];
                  const isSelected = selectedInvItem?.id === item.id;
                  return (
                    <div key={item.id} onClick={() => { setSelectedInvItem(isSelected ? null : item); setSelectedEquipHero(null); }} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 6px', marginBottom: 3, borderRadius: 6, cursor: 'pointer',
                      background: isSelected ? `${tierDef.color}15` : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${isSelected ? tierDef.color + '50' : 'rgba(255,255,255,0.03)'}`,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 4,
                        background: `${tierDef.color}15`, border: `1px solid ${tierDef.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}>
                        <InlineIcon name={item.slot || 'sword'} />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{
                          color: tierDef.color, fontSize: '0.58rem', fontWeight: 700,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.45rem' }}>
                          {SLOT_LABELS[item.slot] || item.slot} · T{item.tier}
                        </div>
                      </div>
                      <div style={{ color: '#fbbf24', fontSize: '0.45rem', fontWeight: 600 }}>
                        {getSellPrice(item)}p
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              consumableItems.length === 0 ? (
                <div style={{ color: '#555', fontSize: '0.55rem', textAlign: 'center', padding: 16 }}>
                  No consumables in inventory
                </div>
              ) : (
                consumableItems.map(item => {
                  const isSelected = selectedInvItem?.id === item.id;
                  return (
                    <div key={item.id} onClick={() => setSelectedInvItem(isSelected ? null : item)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 6px', marginBottom: 3, borderRadius: 6, cursor: 'pointer',
                      background: isSelected ? 'rgba(74,222,128,0.1)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${isSelected ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.03)'}`,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 4,
                        background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}>
                        <InlineIcon name="heart" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#4ade80', fontSize: '0.58rem', fontWeight: 700 }}>
                          {item.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.45rem' }}>
                          {item.description || 'Consumable'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          {selectedInvItem && !selectedInvItem.consumable && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)', padding: 8,
              background: 'rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: (TIERS[selectedInvItem.tier] || TIERS[1]).color, fontSize: '0.6rem', fontWeight: 700 }}>
                  {selectedInvItem.name}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.45rem' }}>
                  {SLOT_LABELS[selectedInvItem.slot]}
                </span>
              </div>

              {selectedInvItem.stats && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {Object.entries(selectedInvItem.stats).filter(([, v]) => v !== 0).map(([stat, val]) => (
                    <span key={stat} style={{
                      color: val > 0 ? '#4ade80' : '#ef4444', fontSize: '0.45rem',
                      background: 'rgba(0,0,0,0.3)', borderRadius: 3, padding: '1px 4px',
                    }}>
                      {val > 0 ? '+' : ''}{typeof val === 'number' && val < 1 && val > -1 ? (val * 100).toFixed(0) + '%' : val} {stat}
                    </span>
                  ))}
                </div>
              )}

              {!selectedEquipHero ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setSelectedEquipHero('pick')} style={{
                    flex: 1, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)',
                    borderRadius: 6, padding: '4px 0', color: '#4ade80', cursor: 'pointer',
                    fontSize: '0.5rem', fontWeight: 700,
                  }}>Equip</button>
                  <button onClick={() => {
                    if (sellItem) sellItem(selectedInvItem.id);
                    else removeFromInventory(selectedInvItem.id);
                    setSelectedInvItem(null);
                  }} style={{
                    flex: 1, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
                    borderRadius: 6, padding: '4px 0', color: '#fbbf24', cursor: 'pointer',
                    fontSize: '0.5rem', fontWeight: 700,
                  }}>Sell ({getSellPrice(selectedInvItem)}p)</button>
                  <button onClick={() => {
                    removeFromInventory(selectedInvItem.id);
                    setSelectedInvItem(null);
                  }} style={{
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 6, padding: '4px 6px', color: '#ef4444', cursor: 'pointer',
                    fontSize: '0.5rem', fontWeight: 700,
                  }}>Drop</button>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.5rem', marginBottom: 4 }}>Equip on:</div>
                  {heroRoster.map(hero => (
                    <button key={hero.id} onClick={() => {
                      equipItem(hero.id, selectedInvItem);
                      setSelectedInvItem(null);
                      setSelectedEquipHero(null);
                    }} style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                      borderRadius: 4, padding: '3px 6px', color: '#6ee7b3', cursor: 'pointer',
                      fontSize: '0.5rem', fontWeight: 600, marginBottom: 2,
                    }}>
                      <span>{hero.name} (Lv{hero.level})</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.4rem' }}>
                        {hero.equipment?.[selectedInvItem.slot] ? `Replace: ${hero.equipment[selectedInvItem.slot].name}` : 'Empty slot'}
                      </span>
                    </button>
                  ))}
                  <button onClick={() => setSelectedEquipHero(null)} style={{
                    width: '100%', background: 'rgba(100,100,100,0.15)', border: '1px solid #555',
                    borderRadius: 4, padding: '3px 0', color: '#888', cursor: 'pointer',
                    fontSize: '0.45rem', marginTop: 2,
                  }}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showSellPanel && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10,15,30,0.95)', border: '2px solid #fbbf24',
          borderRadius: 12, padding: isMobile ? 12 : 16, minWidth: isMobile ? 200 : 220, zIndex: 50,
          backdropFilter: 'blur(8px)',
          maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none',
          width: isMobile ? '90%' : 'auto',
        }}>
          <div className="font-cinzel" style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: 8, textAlign: 'center' }}>
            Sell Resources
          </div>
          {Object.entries(SELL_PRICES).map(([res, price]) => {
            const amount = Math.floor(harvestResources[res] || 0);
            return (
              <div key={res} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div>
                  <span style={{ color: '#e2e8f0', fontSize: '0.6rem' }}>{RESOURCE_LABELS[res] || res}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.5rem', marginLeft: 6 }}>x{amount}</span>
                  <span style={{ color: '#fbbf24', fontSize: '0.45rem', marginLeft: 4 }}>({price}p ea)</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={amount < 10} onClick={() => sellResource(res, 10)} style={{
                    background: amount >= 10 ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                    border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                    padding: '2px 6px', color: amount >= 10 ? '#fbbf24' : '#555', cursor: amount >= 10 ? 'pointer' : 'default',
                    fontSize: '0.45rem', fontWeight: 700,
                  }}>x10</button>
                  <button disabled={amount < 1} onClick={() => sellResource(res, amount)} style={{
                    background: amount >= 1 ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                    border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                    padding: '2px 6px', color: amount >= 1 ? '#fbbf24' : '#555', cursor: amount >= 1 ? 'pointer' : 'default',
                    fontSize: '0.45rem', fontWeight: 700,
                  }}>All</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowSellPanel(false)} style={{
            width: '100%', background: 'rgba(100,100,100,0.2)', border: '1px solid #555',
            borderRadius: 6, padding: '4px 0', color: '#aaa', cursor: 'pointer',
            fontSize: '0.55rem', marginTop: 8,
          }}>Close</button>
        </div>
      )}

      {(SCENE_NPCS.camp || []).map(npc => {
        const pos = npcPositions[npc.id];
        const arrived = npcVisible[npc.id];
        const px = pos ? pos.x : npc.x;
        const py = pos ? pos.y : npc.y;
        const sc = pos ? pos.scale : 1;
        return (
          <div key={npc.id} style={{
            position: 'absolute', left: `${px}%`, top: `${py}%`,
            transform: `translate(-50%, -50%) scale(${sc})`,
            zIndex: 5, pointerEvents: 'none',
            transition: arrived ? 'none' : 'left 0.8s ease-out, top 0.8s ease-out, transform 0.8s ease-out',
            opacity: sc < 0.35 ? 0 : 1,
          }}>
            <NpcSprite npcId={npc.npc} scale={3} flip={npc.flip} name={npc.name} />
          </div>
        );
      })}

      <div onClick={handleExit} style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, cursor: exiting ? 'default' : 'pointer', textAlign: 'center',
        opacity: exiting ? 0.4 : 1, transition: 'opacity 0.3s',
        pointerEvents: exiting ? 'none' : 'auto',
      }}>
        <div style={{
          width: isMobile ? 44 : 50, height: isMobile ? 44 : 50, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,183,0.4), rgba(110,231,183,0.1))',
          border: '2px solid #6ee7b3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isMobile ? '1.1rem' : '1.4rem', boxShadow: '0 0 20px rgba(110,231,183,0.4)',
          animation: 'pulse 2s infinite',
          minWidth: 36, minHeight: 36,
        }}>
          <InlineIcon name="portal" />
        </div>
        <div style={{
          color: '#6ee7b3', fontSize: '0.5rem', fontWeight: 700, marginTop: 3,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>Return to Map</div>
      </div>

      {showReefHunt && (
        <ReefHuntMiniGame
          onClose={() => setShowReefHunt(false)}
          onComplete={handleReefHuntComplete}
        />
      )}
    </div>
  );
}
