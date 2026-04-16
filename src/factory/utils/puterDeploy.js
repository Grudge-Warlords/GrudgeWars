import { puterAuth, puterFS, puterApps, isPuterAvailable } from '../../utils/puterService.js';

async function ensureAuthenticated() {
  if (!isPuterAvailable()) {
    throw new Error('Puter is not available. Please open this app on puter.com to deploy.');
  }
  const signedIn = puterAuth.isSignedIn();
  if (!signedIn) {
    await puterAuth.signIn();
  }
  const user = await puterAuth.getUser();
  if (!user) {
    throw new Error('Authentication failed. Please sign in to Puter to deploy.');
  }
  return user;
}

function generateDeployedHtml(gameSpec) {
  const palette = gameSpec.meta?.colorPalette || {};
  const fonts = gameSpec.meta?.fonts || {};
  const specJson = JSON.stringify(gameSpec, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${gameSpec.meta?.gameName || 'RPG Game'}</title>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.heading || 'Cinzel')}:wght@400;700&family=${encodeURIComponent(fonts.body || 'Jost')}:wght@300;400;600;700&display=swap" rel="stylesheet">
  <script src="https://js.puter.com/v2/"><\/script>
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
      width: 380px;
      max-height: 520px;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ai-model-select {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: #1e293b;
      color: var(--text);
      font-size: 11px;
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
    .ai-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
    .msg.streaming {
      border-color: var(--primary);
      animation: pulse 1s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .ai-save-row {
      display: flex;
      gap: 6px;
      padding: 4px 12px 8px;
    }
    .ai-save-btn {
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: #1e293b;
      color: var(--text);
      cursor: pointer;
      font-size: 11px;
    }
    .ai-save-btn:hover { background: #334155; }
  </style>
</head>
<body>
  <div id="app"></div>
  <div class="ai-editor">
    <button class="ai-btn" onclick="toggleAI()">✨ AI Editor</button>
  </div>
  <div class="ai-panel" id="aiPanel">
    <div class="ai-header">
      <span>AI Game Editor</span>
      <select class="ai-model-select" id="aiModel">
        <option value="gpt-5-nano">GPT-5 Nano</option>
        <option value="gpt-4o-mini">GPT-4o Mini</option>
        <option value="claude-sonnet-4">Claude Sonnet</option>
      </select>
    </div>
    <div class="ai-chat" id="aiChat">
      <div class="msg ai">Welcome! Edit your game by chatting with me. Try "make bosses harder", "add a new race called Merfolk", or ask anything about your game.</div>
    </div>
    <div class="ai-save-row">
      <button class="ai-save-btn" onclick="saveSpec()">💾 Save to Cloud</button>
      <button class="ai-save-btn" onclick="exportSpec()">📥 Export JSON</button>
    </div>
    <div class="ai-input-row">
      <input class="ai-input" id="aiInput" placeholder="Edit your game..." onkeydown="if(event.key==='Enter')sendAI()">
      <button class="ai-send" id="aiSendBtn" onclick="sendAI()">Send</button>
    </div>
  </div>

  <script>
    const GAME_SPEC = ${specJson};
    let aiSending = false;

    function toggleAI() {
      document.getElementById('aiPanel').classList.toggle('open');
    }

    function addMsg(role, text, streaming) {
      const chat = document.getElementById('aiChat');
      const div = document.createElement('div');
      div.className = 'msg ' + role + (streaming ? ' streaming' : '');
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    }

    async function sendAI() {
      if (aiSending) return;
      const input = document.getElementById('aiInput');
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      aiSending = true;
      document.getElementById('aiSendBtn').disabled = true;

      addMsg('user', msg);

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
        const model = document.getElementById('aiModel').value;
        try {
          const streamResp = await puter.ai.chat(
            'You are a game editor AI for "' + GAME_SPEC.meta.gameName + '". The user wants to modify their RPG game. User said: "' + msg + '". Respond with what changes you would make in 2-3 sentences. Be specific and helpful.',
            { model: model, stream: true }
          );
          const msgDiv = addMsg('ai', '', true);
          let fullText = '';
          if (streamResp && typeof streamResp[Symbol.asyncIterator] === 'function') {
            for await (const chunk of streamResp) {
              const text = chunk?.text || chunk?.message?.content || chunk?.toString?.() || '';
              fullText += text;
              msgDiv.textContent = fullText;
              document.getElementById('aiChat').scrollTop = document.getElementById('aiChat').scrollHeight;
            }
          } else {
            fullText = typeof streamResp === 'string' ? streamResp : streamResp?.message?.content || streamResp?.toString?.() || 'Processed your request!';
            msgDiv.textContent = fullText;
          }
          msgDiv.classList.remove('streaming');
          aiSending = false;
          document.getElementById('aiSendBtn').disabled = false;
          return;
        } catch(e) {
          response = 'Processed: ' + msg;
        }
      }

      addMsg('ai', response);
      if (changed) render();
      aiSending = false;
      document.getElementById('aiSendBtn').disabled = false;
    }

    async function saveSpec() {
      try {
        const key = 'factory_' + (GAME_SPEC.meta.gameName || 'game').replace(/\\s+/g, '_') + '_' + Date.now();
        await puter.kv.set(key, JSON.stringify(GAME_SPEC));
        addMsg('ai', 'Game spec saved to Puter cloud! Key: ' + key);
      } catch(e) {
        addMsg('ai', 'Save failed: ' + e.message);
      }
    }

    function exportSpec() {
      const blob = new Blob([JSON.stringify(GAME_SPEC, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (GAME_SPEC.meta.gameName || 'game') + '_spec.json';
      a.click();
      URL.revokeObjectURL(url);
      addMsg('ai', 'Game spec exported as JSON!');
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
  <\/script>
</body>
</html>`;
}

export async function deployToPuter(gameSpec, onProgress) {
  const progress = onProgress || (() => {});

  progress({ step: 'auth', message: 'Checking authentication...', percent: 5 });
  const user = await ensureAuthenticated();
  progress({ step: 'auth', message: `Authenticated as ${user.username || 'user'}`, percent: 15 });

  const gameName = gameSpec.meta?.gameName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'my-rpg';
  const timestamp = Date.now().toString(36);
  const slug = gameName.slice(0, 30) + '-' + timestamp;
  const appDir = `/${slug}`;

  progress({ step: 'files', message: 'Creating app directory...', percent: 25 });
  try {
    await puterFS.mkdir(appDir);
  } catch(e) {}

  progress({ step: 'files', message: 'Generating game HTML...', percent: 35 });
  const indexHtml = generateDeployedHtml(gameSpec);
  const specJson = JSON.stringify(gameSpec, null, 2);

  progress({ step: 'files', message: 'Writing index.html...', percent: 50 });
  await puterFS.write(`${appDir}/index.html`, indexHtml);

  progress({ step: 'files', message: 'Writing gameSpec.json...', percent: 60 });
  await puterFS.write(`${appDir}/gameSpec.json`, specJson);

  progress({ step: 'hosting', message: 'Creating hosted site...', percent: 75 });
  let site;
  try {
    site = await window.puter.hosting.create(slug, appDir);
  } catch(hostErr) {
    progress({ step: 'hosting', message: 'Retrying with alternate slug...', percent: 80 });
    const fallbackSlug = slug + '-' + Math.random().toString(36).slice(2, 6);
    const fallbackDir = `/${fallbackSlug}`;
    try { await puterFS.mkdir(fallbackDir); } catch(e) {}
    await puterFS.write(`${fallbackDir}/index.html`, indexHtml);
    await puterFS.write(`${fallbackDir}/gameSpec.json`, specJson);
    site = await window.puter.hosting.create(fallbackSlug, fallbackDir);

    progress({ step: 'app', message: 'Registering app entry...', percent: 90 });
    try {
      await puterApps.create(fallbackSlug, {
        title: gameSpec.meta?.gameName || 'RPG Game',
        description: gameSpec.meta?.tagline || 'A game built with Game Factory',
        indexURL: `https://${fallbackSlug}.puter.site`,
      });
    } catch(e) {}

    progress({ step: 'done', message: 'Deployment complete!', percent: 100 });
    return { success: true, url: `https://${fallbackSlug}.puter.site`, siteInfo: site, user };
  }

  progress({ step: 'app', message: 'Registering app entry...', percent: 90 });
  try {
    await puterApps.create(slug, {
      title: gameSpec.meta?.gameName || 'RPG Game',
      description: gameSpec.meta?.tagline || 'A game built with Game Factory',
      indexURL: `https://${slug}.puter.site`,
    });
  } catch(e) {
    try {
      await puterApps.update(slug, {
        title: gameSpec.meta?.gameName || 'RPG Game',
        description: gameSpec.meta?.tagline || 'A game built with Game Factory',
        indexURL: `https://${slug}.puter.site`,
      });
    } catch(e2) {}
  }

  progress({ step: 'done', message: 'Deployment complete!', percent: 100 });
  return {
    success: true,
    url: `https://${slug}.puter.site`,
    siteInfo: site,
    user,
  };
}

export async function saveSpecToCloud(gameSpec) {
  if (!isPuterAvailable()) {
    localStorage.setItem('factory_gameSpec', JSON.stringify(gameSpec));
    return { saved: true, location: 'local' };
  }

  await ensureAuthenticated();
  const gameName = gameSpec.meta?.gameName?.replace(/\s+/g, '_') || 'game';
  const key = `factory_${gameName}_${Date.now()}`;

  await puterFS.write(`/game-specs/${gameName}.json`, JSON.stringify(gameSpec, null, 2)).catch(() => {});
  await window.puter.kv.set(key, JSON.stringify(gameSpec));

  return { saved: true, location: 'cloud', key };
}

export async function loadSpecsFromCloud() {
  const specs = [];

  const local = localStorage.getItem('factory_gameSpec');
  if (local) {
    try { specs.push({ source: 'local', spec: JSON.parse(local) }); } catch(e) {}
  }

  if (isPuterAvailable()) {
    try {
      const signedIn = puterAuth.isSignedIn();
      if (signedIn) {
        const keys = await window.puter.kv.list();
        const factoryKeys = (keys || []).filter(k => typeof k === 'string' && k.startsWith('factory_'));
        for (const key of factoryKeys.slice(0, 10)) {
          try {
            const val = await window.puter.kv.get(key);
            if (val) specs.push({ source: 'cloud', key, spec: JSON.parse(val) });
          } catch(e) {}
        }

        try {
          const files = await puterFS.readdir('/game-specs');
          for (const file of (files || []).slice(0, 10)) {
            try {
              const content = await puterFS.read(`/game-specs/${file.name || file}`);
              const text = typeof content === 'string' ? content : await content.text();
              specs.push({ source: 'cloud-fs', path: `/game-specs/${file.name || file}`, spec: JSON.parse(text) });
            } catch(e) {}
          }
        } catch(e) {}
      }
    } catch(e) {}
  }

  return specs;
}
