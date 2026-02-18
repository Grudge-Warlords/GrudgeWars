import React, { useState, useRef, useEffect, useCallback } from 'react';

export function AIEditor({ spec, onUpdate, onBack }) {
  const [messages, setMessages] = useState([
    { role: 'system', content: `Welcome to the AI Game Editor! You can modify your game "${spec.meta?.gameName}" by chatting with me.\n\nTry things like:\n- "Add a new race called Shadow Elves"\n- "Make the first boss harder"\n- "Change the color palette to green and gold"\n- "Add a new chapter about a dragon invasion"\n- "Rename the currency to Credits"` }
  ]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const chatRef = useRef(null);
  const palette = spec.meta?.colorPalette || {};
  const fonts = spec.meta?.fonts || {};

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const processCommand = useCallback(async (userMsg) => {
    setProcessing(true);
    const newSpec = JSON.parse(JSON.stringify(spec));
    if (!Array.isArray(newSpec.races)) newSpec.races = [];
    if (!Array.isArray(newSpec.classes)) newSpec.classes = [];
    if (!Array.isArray(newSpec.enemies)) newSpec.enemies = [];
    if (!Array.isArray(newSpec.bosses)) newSpec.bosses = [];
    if (!Array.isArray(newSpec.chapters)) newSpec.chapters = [];
    if (!newSpec.meta) newSpec.meta = {};
    if (!newSpec.meta.colorPalette) newSpec.meta.colorPalette = {};
    if (!newSpec.meta.currency) newSpec.meta.currency = { name: 'Gold', plural: 'Gold' };
    if (!newSpec.lore) newSpec.lore = {};
    let response = '';

    try {
      const prompt = `You are a game design AI editor. The user wants to modify their RPG game spec.
Current game: "${spec.meta?.gameName}" with theme "${spec.meta?.theme}"
Current races: ${spec.races?.map(r => r.name).join(', ')}
Current classes: ${spec.classes?.map(c => c.name).join(', ')}
Current bosses: ${spec.bosses?.map(b => b.name).join(', ')}

User request: "${userMsg}"

Analyze the request and return a JSON object with:
- action: what to do (add_race, modify_race, add_class, modify_class, add_enemy, modify_enemy, add_boss, modify_boss, add_chapter, modify_chapter, change_meta, change_palette, add_location, modify_lore, other)
- target: which item to modify (name or id)
- changes: object with the specific changes
- description: human-readable summary of what was changed

Return ONLY valid JSON.`;

      let aiResult = null;
      if (typeof window !== 'undefined' && window.puter) {
        try {
          const resp = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
          const text = typeof resp === 'string' ? resp : resp?.message?.content || '';
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/[\[{][\s\S]*[\]}]/);
          if (jsonMatch) {
            aiResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          }
        } catch(e) {
          console.warn('AI parse failed:', e);
        }
      }

      if (aiResult) {
        response = applyAIChanges(newSpec, aiResult, userMsg);
      } else {
        response = applyDirectChanges(newSpec, userMsg);
      }

      if (response) {
        onUpdate(newSpec);
      }
    } catch (err) {
      response = `I encountered an error: ${err.message}. Try rephrasing your request.`;
    }

    setMessages(prev => [...prev, { role: 'assistant', content: response || "I've processed your request. Check the preview to see changes!" }]);
    setProcessing(false);
  }, [spec, onUpdate]);

  const handleSend = useCallback(() => {
    if (!input.trim() || processing) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    processCommand(userMsg);
  }, [input, processing, processCommand]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${palette.background || '#0a0a1a'} 0%, #1a1a2e 100%)`,
      color: palette.text || '#e2e8f0',
      fontFamily: `'${fonts.body || 'Jost'}', sans-serif`,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #334155',
    },
    title: {
      fontFamily: `'${fonts.heading || 'Cinzel'}', serif`,
      fontSize: '20px',
      color: palette.primary,
    },
    backBtn: {
      padding: '8px 20px',
      borderRadius: '8px',
      border: `1px solid ${palette.primary}`,
      background: 'transparent',
      color: palette.primary,
      cursor: 'pointer',
      fontSize: '13px',
    },
    chatArea: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 160px)',
    },
    message: (role) => ({
      maxWidth: '80%',
      marginLeft: role === 'user' ? 'auto' : '0',
      marginRight: role === 'user' ? '0' : 'auto',
      marginBottom: '12px',
      padding: '12px 16px',
      borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      background: role === 'user' ? palette.primary + '30' : role === 'system' ? '#1e293b' : '#0f172a',
      border: `1px solid ${role === 'user' ? palette.primary + '50' : '#334155'}`,
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
    }),
    inputRow: {
      display: 'flex',
      gap: '8px',
      padding: '16px 20px',
      borderTop: '1px solid #334155',
      background: '#0f172a',
    },
    chatInput: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #334155',
      background: '#1e293b',
      color: '#e2e8f0',
      fontSize: '14px',
      fontFamily: `'${fonts.body}', sans-serif`,
      outline: 'none',
    },
    sendBtn: {
      padding: '12px 24px',
      borderRadius: '12px',
      border: 'none',
      background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
      color: '#fff',
      fontWeight: '700',
      cursor: processing ? 'wait' : 'pointer',
      opacity: processing ? 0.6 : 1,
      fontSize: '14px',
    },
    quickActions: {
      display: 'flex',
      gap: '6px',
      padding: '8px 20px',
      flexWrap: 'wrap',
      borderTop: '1px solid #1e293b',
    },
    quickBtn: {
      padding: '6px 12px',
      borderRadius: '16px',
      border: '1px solid #334155',
      background: '#1e293b',
      color: '#94a3b8',
      fontSize: '11px',
      cursor: 'pointer',
    },
  };

  const quickActions = [
    'Add a new race',
    'Make bosses harder',
    'Add a new chapter',
    'Change color palette',
    'Add more enemies',
    'Rename the currency',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>AI Game Editor - {spec.meta?.gameName}</h2>
        <button style={styles.backBtn} onClick={onBack}>Back to Factory</button>
      </div>

      <div style={styles.chatArea} ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} style={styles.message(msg.role)}>
            {msg.role === 'user' && <div style={{ fontSize: '10px', color: palette.primary, marginBottom: '4px' }}>You</div>}
            {msg.role === 'assistant' && <div style={{ fontSize: '10px', color: palette.secondary, marginBottom: '4px' }}>AI Editor</div>}
            {msg.content}
          </div>
        ))}
        {processing && (
          <div style={styles.message('assistant')}>
            <div style={{ color: palette.primary }}>Thinking...</div>
          </div>
        )}
      </div>

      <div style={styles.quickActions}>
        {quickActions.map(qa => (
          <button key={qa} style={styles.quickBtn} onClick={() => { setInput(qa); }}>
            {qa}
          </button>
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.chatInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Tell me how to modify your game..."
          disabled={processing}
        />
        <button style={styles.sendBtn} onClick={handleSend} disabled={processing}>
          {processing ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function applyAIChanges(spec, aiResult, userMsg) {
  const { action, target, changes, description } = aiResult;

  switch (action) {
    case 'add_race':
      if (changes) {
        const id = changes.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'new_race';
        spec.races.push({
          id,
          name: changes.name || 'New Race',
          icon: `/images/races/${id}.png`,
          color: changes.color || '#06b6d4',
          description: changes.description || 'A new race',
          lore: changes.lore || '',
          bonuses: changes.bonuses || { Strength: 1, Vitality: 1, Endurance: 1, Dexterity: 1, Agility: 1, Intellect: 1, Wisdom: 1, Tactics: 1 },
          passive: changes.passive || '+1 All',
          trait: changes.trait || 'Unique Trait',
          traitDescription: changes.traitDescription || 'A unique racial ability',
        });
      }
      return description || `Added new race: ${changes?.name || 'New Race'}`;

    case 'modify_race': {
      const race = spec.races.find(r => r.name.toLowerCase().includes(target?.toLowerCase()));
      if (race && changes) Object.assign(race, changes);
      return description || `Modified race: ${target}`;
    }

    case 'add_class':
      if (changes) {
        const id = changes.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'new_class';
        spec.classes.push({
          id,
          name: changes.name || 'New Class',
          icon: 'sword',
          color: changes.color || '#a855f7',
          description: changes.description || 'A new class',
          lore: changes.lore || '',
          role: changes.role || 'DPS',
          startingAttributes: changes.startingAttributes || {},
          abilities: changes.abilities || [],
          signatureAbility: changes.signatureAbility || null,
        });
      }
      return description || `Added new class: ${changes?.name || 'New Class'}`;

    case 'add_boss':
      if (changes) {
        const id = changes.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'new_boss';
        spec.bosses.push({
          id,
          name: changes.name || 'New Boss',
          title: changes.title || 'The Fearsome',
          icon: 'skull',
          color: changes.color || '#ef4444',
          portrait: `/images/bosses/${id}.png`,
          baseHealth: changes.baseHealth || 500,
          baseDamage: changes.baseDamage || 40,
          baseDefense: changes.baseDefense || 25,
          baseMana: 200,
          xpReward: 200,
          goldReward: 100,
          speed: 12,
          isBoss: true,
          level: changes.level || 10,
          description: changes.description || 'A fearsome boss.',
          lore: changes.lore || '',
          abilities: changes.abilities || [],
        });
      }
      return description || `Added new boss`;

    case 'modify_boss': {
      const targetBosses = target
        ? spec.bosses.filter(b => b.name.toLowerCase().includes(target.toLowerCase()))
        : spec.bosses;
      if (targetBosses.length === 0 && target) {
        return `Could not find a boss matching "${target}". Available bosses: ${spec.bosses.map(b => b.name).join(', ')}`;
      }
      targetBosses.forEach(b => {
        if (changes?.healthMultiplier) b.baseHealth = Math.round(b.baseHealth * changes.healthMultiplier);
        if (changes?.damageMultiplier) b.baseDamage = Math.round(b.baseDamage * changes.damageMultiplier);
        if (changes?.defenseMultiplier) b.baseDefense = Math.round(b.baseDefense * changes.defenseMultiplier);
        if (changes?.name) b.name = changes.name;
        if (changes?.description) b.description = changes.description;
        if (changes?.level) b.level = changes.level;
        if (changes?.color) b.color = changes.color;
      });
      return description || `Modified ${targetBosses.length} boss(es): ${targetBosses.map(b => b.name).join(', ')}`;
    }

    case 'change_meta':
      if (changes) Object.assign(spec.meta, changes);
      return description || `Updated game metadata`;

    case 'change_palette':
      if (changes) Object.assign(spec.meta.colorPalette, changes);
      return description || `Updated color palette`;

    case 'add_chapter':
      if (changes) {
        const num = (spec.chapters?.length || 0) + 1;
        spec.chapters.push({
          id: `chapter_${num}`,
          number: num,
          title: changes.title || `Chapter ${num}`,
          subtitle: changes.subtitle || '',
          description: changes.description || '',
          color: changes.color || '#06b6d4',
          objectives: changes.objectives || [],
          rewards: changes.rewards || { xp: 100 * num, currency: 50 * num },
          loreReveal: changes.loreReveal || '',
        });
      }
      return description || `Added new chapter`;

    case 'modify_lore':
      if (changes) Object.assign(spec.lore, changes);
      return description || `Updated game lore`;

    default:
      return description || `Processed: ${userMsg}`;
  }
}

function applyDirectChanges(spec, userMsg) {
  const msg = userMsg.toLowerCase();

  if (msg.includes('harder') && (msg.includes('boss') || msg.includes('enemies'))) {
    const targets = msg.includes('boss') ? spec.bosses : spec.enemies;
    targets?.forEach(e => {
      e.baseHealth = Math.round(e.baseHealth * 1.3);
      e.baseDamage = Math.round(e.baseDamage * 1.2);
      e.baseDefense = Math.round(e.baseDefense * 1.15);
    });
    return `Made ${msg.includes('boss') ? 'bosses' : 'enemies'} 30% harder! (HP +30%, ATK +20%, DEF +15%)`;
  }

  if (msg.includes('easier') && (msg.includes('boss') || msg.includes('enemies'))) {
    const targets = msg.includes('boss') ? spec.bosses : spec.enemies;
    targets?.forEach(e => {
      e.baseHealth = Math.round(e.baseHealth * 0.7);
      e.baseDamage = Math.round(e.baseDamage * 0.8);
    });
    return `Made ${msg.includes('boss') ? 'bosses' : 'enemies'} easier! (HP -30%, ATK -20%)`;
  }

  if (msg.includes('rename') && msg.includes('currency')) {
    const match = userMsg.match(/(?:to|as)\s+["']?(\w+)["']?/i);
    if (match) {
      spec.meta.currency.name = match[1];
      spec.meta.currency.plural = match[1];
      return `Renamed currency to "${match[1]}"!`;
    }
  }

  if (msg.includes('add') && msg.includes('race')) {
    const nameMatch = userMsg.match(/called\s+["']?([^"']+)["']?/i) || userMsg.match(/race\s+["']?([^"']+)["']?/i);
    const name = nameMatch?.[1] || 'New Race';
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    spec.races.push({
      id,
      name,
      icon: `/images/races/${id}.png`,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      description: `A unique ${name} from the ${spec.meta.theme} world.`,
      lore: `The ${name} have a rich history in ${spec.lore?.title || 'the realm'}.`,
      bonuses: { Strength: 2, Vitality: 2, Endurance: 1, Dexterity: 1, Agility: 1, Intellect: 1, Wisdom: 1, Tactics: 1 },
      passive: '+2 Strength, +2 Vitality',
      trait: `${name} Heritage`,
      traitDescription: `A unique trait of the ${name}.`,
    });
    return `Added new race "${name}"! (${spec.races.length} total races now)`;
  }

  if (msg.includes('add') && msg.includes('chapter')) {
    const num = (spec.chapters?.length || 0) + 1;
    spec.chapters.push({
      id: `chapter_${num}`,
      number: num,
      title: `Chapter ${num}: New Adventure`,
      subtitle: 'The story continues',
      description: 'A new chapter in your journey.',
      color: '#06b6d4',
      objectives: [{ id: `ch${num}_obj1`, text: 'Complete the quest', type: 'quest' }],
      rewards: { xp: 100 * num, currency: 50 * num },
      loreReveal: 'New secrets are revealed.',
    });
    return `Added Chapter ${num}! You now have ${spec.chapters.length} chapters.`;
  }

  return `I processed your request: "${userMsg}". The AI will expand on this when Puter AI is available. For now, try specific commands like "add a race called X" or "make bosses harder".`;
}
