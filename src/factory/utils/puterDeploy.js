export async function deployToPuter(gameSpec) {
  if (!window.puter) {
    throw new Error('Puter is not available. Please open this app on puter.com to deploy.');
  }

  const gameName = gameSpec.meta?.gameName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'my-rpg';
  const palette = gameSpec.meta?.colorPalette || {};
  const fonts = gameSpec.meta?.fonts || {};

  const specJson = JSON.stringify(gameSpec, null, 2);

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${gameSpec.meta?.gameName || 'RPG Game'}</title>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.heading || 'Cinzel')}:wght@400;700&family=${encodeURIComponent(fonts.body || 'Jost')}:wght@300;400;600;700&display=swap" rel="stylesheet">
  <script src="https://js.puter.com/v2/"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: ${palette.primary || '#06b6d4'};
      --secondary: ${palette.secondary || '#a855f7'};
      --accent: ${palette.accent || '#f59e0b'};
      --danger: ${palette.danger || '#ef4444'};
      --bg: ${palette.background || '#0a0a1a'};
      --text: ${palette.text || '#e2e8f0'};
    }
    body {
      font-family: '${fonts.body || 'Jost'}', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    h1, h2, h3 { font-family: '${fonts.heading || 'Cinzel'}', serif; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, var(--bg), #1a1a2e);
    }
    .hero h1 {
      font-size: clamp(28px, 6vw, 52px);
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p { color: #94a3b8; font-size: 16px; margin-top: 8px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      padding: 20px;
    }
    .card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-2px); }
    .card h3 { color: var(--primary); font-size: 16px; margin-bottom: 4px; }
    .card p { color: #94a3b8; font-size: 13px; line-height: 1.5; }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      margin: 2px;
    }
    .section { padding: 30px 20px; }
    .section-title {
      font-size: 24px;
      color: var(--primary);
      margin-bottom: 16px;
      text-align: center;
    }
    .lore-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      line-height: 1.8;
      font-size: 14px;
      white-space: pre-wrap;
      max-width: 700px;
      margin: 0 auto;
    }
    .stat { text-align: center; padding: 12px; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #64748b; }
    .ai-editor {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    .ai-btn {
      padding: 12px 24px;
      border-radius: 25px;
      border: none;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .ai-panel {
      display: none;
      position: fixed;
      bottom: 70px;
      right: 20px;
      width: 350px;
      max-height: 500px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 16px;
      overflow: hidden;
      flex-direction: column;
    }
    .ai-panel.open { display: flex; }
    .ai-header {
      padding: 12px 16px;
      border-bottom: 1px solid #334155;
      font-weight: 700;
      color: var(--primary);
    }
    .ai-chat {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      max-height: 350px;
    }
    .ai-input-row {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #334155;
    }
    .ai-input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #1e293b;
      color: var(--text);
      font-size: 13px;
    }
    .ai-send {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: var(--primary);
      color: white;
      cursor: pointer;
      font-weight: 700;
    }
    .msg {
      margin-bottom: 8px;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }
    .msg.user {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      margin-left: 20%;
    }
    .msg.ai {
      background: #1e293b;
      border: 1px solid #334155;
      margin-right: 20%;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <div class="ai-editor">
    <button class="ai-btn" onclick="toggleAI()">AI Editor</button>
  </div>
  <div class="ai-panel" id="aiPanel">
    <div class="ai-header">AI Game Editor</div>
    <div class="ai-chat" id="aiChat">
      <div class="msg ai">Welcome! You can edit this game by chatting with me. Try "make bosses harder" or "add a new race".</div>
    </div>
    <div class="ai-input-row">
      <input class="ai-input" id="aiInput" placeholder="Edit your game..." onkeydown="if(event.key==='Enter')sendAI()">
      <button class="ai-send" onclick="sendAI()">Send</button>
    </div>
  </div>

  <script>
    const GAME_SPEC = ${specJson};
    
    function toggleAI() {
      document.getElementById('aiPanel').classList.toggle('open');
    }
    
    async function sendAI() {
      const input = document.getElementById('aiInput');
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      
      const chat = document.getElementById('aiChat');
      chat.innerHTML += '<div class="msg user">' + msg + '</div>';
      
      const lower = msg.toLowerCase();
      let changed = false;
      let response = '';

      if (lower.includes('harder') && (lower.includes('boss') || lower.includes('enem'))) {
        const targets = lower.includes('boss') ? GAME_SPEC.bosses : GAME_SPEC.enemies;
        (targets || []).forEach(e => { e.baseHealth = Math.round(e.baseHealth * 1.3); e.baseDamage = Math.round(e.baseDamage * 1.2); });
        response = 'Made ' + (lower.includes('boss') ? 'bosses' : 'enemies') + ' 30% harder!';
        changed = true;
      } else if (lower.includes('easier') && (lower.includes('boss') || lower.includes('enem'))) {
        const targets = lower.includes('boss') ? GAME_SPEC.bosses : GAME_SPEC.enemies;
        (targets || []).forEach(e => { e.baseHealth = Math.round(e.baseHealth * 0.7); e.baseDamage = Math.round(e.baseDamage * 0.8); });
        response = 'Made ' + (lower.includes('boss') ? 'bosses' : 'enemies') + ' easier!';
        changed = true;
      } else if (lower.includes('add') && lower.includes('race')) {
        const nameMatch = msg.match(/called\\s+["']?([^"']+)["']?/i);
        const name = nameMatch ? nameMatch[1] : 'New Race';
        if (!GAME_SPEC.races) GAME_SPEC.races = [];
        GAME_SPEC.races.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g,'_'), name: name, color: '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'), description: 'A new race', lore: '', trait: name+' Heritage', traitDescription: 'A unique trait', bonuses: {}, passive: '+1 All' });
        response = 'Added race: ' + name;
        changed = true;
      } else {
        try {
          const resp = await puter.ai.chat(
            'You are a game editor. The user said: "' + msg + '". Current game: ' + GAME_SPEC.meta.gameName + '. Describe what changes you would make in 1-2 sentences.',
            { model: 'gpt-4o-mini' }
          );
          response = typeof resp === 'string' ? resp : resp?.message?.content || 'Processed your request!';
        } catch(e) {
          response = 'Processed: ' + msg;
        }
      }
      
      chat.innerHTML += '<div class="msg ai">' + response + '</div>';
      if (changed) render();
      chat.scrollTop = chat.scrollHeight;
    }

    function render() {
      const app = document.getElementById('app');
      let html = '';
      
      html += '<div class="hero">';
      html += '<h1>' + GAME_SPEC.meta.gameName + '</h1>';
      html += '<p>' + (GAME_SPEC.meta.tagline || '') + '</p>';
      html += '<p style="margin-top:12px;color:#64748b;font-size:13px">' + (GAME_SPEC.meta.setting || '') + '</p>';
      html += '</div>';

      const stats = [
        { label: 'Races', value: GAME_SPEC.races?.length || 0, color: 'var(--primary)' },
        { label: 'Classes', value: GAME_SPEC.classes?.length || 0, color: 'var(--secondary)' },
        { label: 'Enemies', value: GAME_SPEC.enemies?.length || 0, color: 'var(--danger)' },
        { label: 'Bosses', value: GAME_SPEC.bosses?.length || 0, color: 'var(--accent)' },
        { label: 'Chapters', value: GAME_SPEC.chapters?.length || 0, color: '#22c55e' },
        { label: 'Locations', value: GAME_SPEC.worldMap?.locations?.length || 0, color: '#3b82f6' },
      ];
      html += '<div class="grid" style="max-width:600px;margin:20px auto">';
      stats.forEach(s => {
        html += '<div class="stat"><div class="stat-value" style="color:' + s.color + '">' + s.value + '</div><div class="stat-label">' + s.label + '</div></div>';
      });
      html += '</div>';

      if (GAME_SPEC.lore?.prologue) {
        html += '<div class="section"><h2 class="section-title">World Lore</h2>';
        html += '<div class="lore-box">' + GAME_SPEC.lore.prologue + '</div></div>';
      }

      if (GAME_SPEC.races?.length) {
        html += '<div class="section"><h2 class="section-title">Playable Races</h2><div class="grid">';
        GAME_SPEC.races.forEach(r => {
          html += '<div class="card" style="border-left:4px solid ' + r.color + '">';
          html += '<h3 style="color:' + r.color + '">' + r.name + '</h3>';
          html += '<span class="tag" style="background:' + r.color + '20;color:' + r.color + '">' + r.trait + '</span>';
          html += '<p>' + r.description + '</p></div>';
        });
        html += '</div></div>';
      }

      if (GAME_SPEC.classes?.length) {
        html += '<div class="section"><h2 class="section-title">Classes</h2><div class="grid">';
        GAME_SPEC.classes.forEach(c => {
          html += '<div class="card" style="border-left:4px solid ' + c.color + '">';
          html += '<h3 style="color:' + c.color + '">' + c.name + '</h3>';
          html += '<span class="tag" style="background:' + c.color + '20;color:' + c.color + '">' + (c.role || '') + '</span>';
          html += '<p>' + c.description + '</p></div>';
        });
        html += '</div></div>';
      }

      if (GAME_SPEC.bosses?.length) {
        html += '<div class="section"><h2 class="section-title">Boss Encounters</h2><div class="grid">';
        GAME_SPEC.bosses.forEach(b => {
          html += '<div class="card" style="border-left:4px solid ' + b.color + '">';
          html += '<h3 style="color:' + b.color + '">' + b.name + '</h3>';
          html += '<p style="font-style:italic;color:' + b.color + ';font-size:12px;margin-bottom:6px">' + (b.title || '') + '</p>';
          html += '<p>' + (b.description || '') + '</p></div>';
        });
        html += '</div></div>';
      }

      if (GAME_SPEC.chapters?.length) {
        html += '<div class="section"><h2 class="section-title">Story Chapters</h2><div class="grid">';
        GAME_SPEC.chapters.forEach(ch => {
          html += '<div class="card" style="border-top:3px solid ' + ch.color + '">';
          html += '<div style="font-size:11px;color:#64748b">Chapter ' + ch.number + '</div>';
          html += '<h3 style="color:' + ch.color + '">' + ch.title + '</h3>';
          html += '<p>' + ch.description + '</p></div>';
        });
        html += '</div></div>';
      }

      html += '<div style="text-align:center;padding:40px;color:#64748b;font-size:12px">';
      html += 'Generated by Game Factory | ' + (GAME_SPEC.meta.studioName || 'Grudge Studios');
      html += '</div>';

      app.innerHTML = html;
    }

    render();
  </script>
</body>
</html>`;

  try {
    const timestamp = Date.now().toString(36);
    const slug = gameName.slice(0, 30) + '-' + timestamp;
    const appDir = `/${slug}`;
    try { await puter.fs.mkdir(appDir); } catch(e) {}
    
    await puter.fs.write(`${appDir}/index.html`, indexHtml);
    await puter.fs.write(`${appDir}/gameSpec.json`, specJson);

    let site;
    try {
      site = await puter.hosting.create(slug, appDir);
    } catch(hostErr) {
      const fallbackSlug = slug + '-' + Math.random().toString(36).slice(2, 6);
      try {
        const fallbackDir = `/${fallbackSlug}`;
        try { await puter.fs.mkdir(fallbackDir); } catch(e) {}
        await puter.fs.write(`${fallbackDir}/index.html`, indexHtml);
        await puter.fs.write(`${fallbackDir}/gameSpec.json`, specJson);
        site = await puter.hosting.create(fallbackSlug, fallbackDir);
        return { success: true, url: `https://${fallbackSlug}.puter.site`, siteInfo: site };
      } catch(e2) {
        throw new Error(`Hosting failed: ${hostErr.message}. Retry also failed: ${e2.message}`);
      }
    }
    
    return {
      success: true,
      url: `https://${slug}.puter.site`,
      siteInfo: site,
    };
  } catch (err) {
    console.error('Deploy failed:', err);
    throw new Error(`Deploy failed: ${err.message}`);
  }
}

export async function saveSpecToCloud(gameSpec) {
  if (!window.puter) {
    localStorage.setItem('factory_gameSpec', JSON.stringify(gameSpec));
    return { saved: true, location: 'local' };
  }
  
  const key = `factory_${gameSpec.meta?.gameName?.replace(/\s+/g, '_') || 'game'}_${Date.now()}`;
  await puter.kv.set(key, JSON.stringify(gameSpec));
  return { saved: true, location: 'cloud', key };
}

export async function loadSpecsFromCloud() {
  const specs = [];
  
  const local = localStorage.getItem('factory_gameSpec');
  if (local) {
    try { specs.push({ source: 'local', spec: JSON.parse(local) }); } catch(e) {}
  }
  
  if (window.puter) {
    try {
      const keys = await puter.kv.list();
      const factoryKeys = (keys || []).filter(k => typeof k === 'string' && k.startsWith('factory_'));
      for (const key of factoryKeys.slice(0, 10)) {
        try {
          const val = await puter.kv.get(key);
          if (val) specs.push({ source: 'cloud', key, spec: JSON.parse(val) });
        } catch(e) {}
      }
    } catch(e) {}
  }
  
  return specs;
}
