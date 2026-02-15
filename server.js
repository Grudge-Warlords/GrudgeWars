import express from 'express';
import crypto from 'crypto';
import { verifyKeyMiddleware, InteractionType, InteractionResponseType } from 'discord-interactions';

const app = express();
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

app.use((req, res, next) => {
  if (req.path === '/api/discord/interactions') {
    return next();
  }
  express.json()(req, res, next);
});

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.GAME_API_GRUDA;
const BETA_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '1470521372932313283';
const BOT_CHANNEL_ID = '1472448936735277188';
const BOT_APP_ID = '1472444305187668009';
const GUILD_ID = '1335136143112671296';
const PORT = 3001;

const pendingStates = new Map();

function getPublicOrigin(req) {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = forwardedHost?.split(',')[0]?.trim();
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
  if (domain) return `https://${domain}`;
  return `${proto}://${host || 'localhost:5000'}`;
}

app.get('/api/discord/login', (req, res) => {
  const origin = getPublicOrigin(req);
  const redirectUri = encodeURIComponent(`${origin}/discordauth`);
  const scope = encodeURIComponent('identify guilds guilds.join email');
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now());
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
  res.json({ url, state });
});

app.post('/api/discord/callback', async (req, res) => {
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  if (state && pendingStates.has(state)) {
    pendingStates.delete(state);
  }

  for (const [k, v] of pendingStates) {
    if (Date.now() - v > 600000) pendingStates.delete(k);
  }

  try {
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/discordauth`;

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch user' });
    }

    const user = await userRes.json();

    let inviteLink = null;
    try {
      inviteLink = await createBetaInvite();
    } catch (inviteErr) {
      console.error('Invite creation failed:', inviteErr.message);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        email: user.email,
        globalName: user.global_name,
      },
      invite: inviteLink,
    });
  } catch (err) {
    console.error('Discord callback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function createBetaInvite() {
  const botToken = process.env.GAME_API_GRUDA;
  if (!botToken) throw new Error('Bot token not configured');

  const inviteRes = await fetch(`https://discord.com/api/v10/channels/${BETA_CHANNEL_ID}/invites`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_age: 86400,
      max_uses: 1,
      unique: true,
    }),
  });

  if (!inviteRes.ok) {
    const err = await inviteRes.text();
    throw new Error(`Invite creation failed: ${err}`);
  }

  const invite = await inviteRes.json();
  return `https://discord.gg/${invite.code}`;
}

app.get('/api/discord/invite', async (req, res) => {
  try {
    const link = await createBetaInvite();
    res.json({ invite: link });
  } catch (err) {
    console.error('Invite error:', err.message);
    res.status(500).json({ error: 'Could not create invite' });
  }
});

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_GRUDGE_WEBHOOK;
const DISCORD_WEBHOOK_CHAT = process.env.DISCORD_WEBHOOK_CHAT;
const DISCORD_WEBHOOK_URL_ANNOUNCE = process.env.DISCORD_WEBHOOK_URL_ANNOUNCE;
const ANNOUNCE_CHANNEL_ID = '1472449203283431494';
const CHAT_CHANNEL_ID = '1472457126885462239';
const ADMIN_TOKEN = process.env.GAME_API_GRUDA;

function requireAdmin(req, res, next) {
  const auth = req.headers['x-admin-token'];
  if (!auth || !ADMIN_TOKEN || auth !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/discord/webhook/verify', (req, res) => {
  const auth = req.headers['x-admin-token'];
  if (!auth || !ADMIN_TOKEN || auth !== ADMIN_TOKEN) {
    return res.status(403).json({ authorized: false });
  }
  res.json({ authorized: true });
});

const EMBED_COLORS = {
  update: 0x6ee7b3,
  patch: 0xa78bfa,
  challenge: 0xf59e0b,
  event: 0xef4444,
  milestone: 0x3b82f6,
  lore: 0x8b5cf6,
  tip: 0x10b981,
};

async function sendWebhookMessage({ content, embeds, username, avatar_url }) {
  if (!DISCORD_WEBHOOK_URL) throw new Error('Webhook URL not configured');
  const payload = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  payload.username = username || 'Betta Warlords';
  payload.avatar_url = avatar_url || 'https://grudgewarlords.com/icons/logo.png';
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Webhook failed (${res.status}): ${err}`);
  }
  return true;
}

app.post('/api/discord/webhook/update', requireAdmin, async (req, res) => {
  const { title, description, features, version } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = (features || []).map(f => ({ name: f.name || 'Feature', value: f.value || f, inline: true }));
    if (version) fields.unshift({ name: 'Version', value: version, inline: true });
    await sendWebhookMessage({
      content: '## Game Update Available!',
      embeds: [{
        title: `Update: ${title}`,
        description,
        color: EMBED_COLORS.update,
        fields,
        footer: { text: 'Betta Warlords | grudgewarlords.com' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/patch', requireAdmin, async (req, res) => {
  const { version, changes, bugfixes } = req.body;
  if (!version) return res.status(400).json({ error: 'Version required' });
  try {
    const changeList = (changes || []).map(c => `- ${c}`).join('\n') || 'No changes listed';
    const bugList = (bugfixes || []).map(b => `- ${b}`).join('\n');
    const fields = [{ name: 'Changes', value: changeList }];
    if (bugList) fields.push({ name: 'Bug Fixes', value: bugList });
    await sendWebhookMessage({
      content: `## Patch Notes - v${version}`,
      embeds: [{
        title: `Patch ${version}`,
        description: 'A new patch has been deployed! Here\'s what changed:',
        color: EMBED_COLORS.patch,
        fields,
        footer: { text: 'Betta Warlords | Patch Notes' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook patch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/challenge', requireAdmin, async (req, res) => {
  const { title, description, reward, deadline } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = [];
    if (reward) fields.push({ name: 'Reward', value: reward, inline: true });
    if (deadline) fields.push({ name: 'Deadline', value: deadline, inline: true });
    await sendWebhookMessage({
      content: '## New Community Challenge!',
      embeds: [{
        title: `Challenge: ${title}`,
        description,
        color: EMBED_COLORS.challenge,
        fields,
        footer: { text: 'Betta Warlords | Community Challenge' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook challenge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/event', requireAdmin, async (req, res) => {
  const { title, description, startTime, endTime } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = [];
    if (startTime) fields.push({ name: 'Starts', value: startTime, inline: true });
    if (endTime) fields.push({ name: 'Ends', value: endTime, inline: true });
    await sendWebhookMessage({
      content: '## Live Event Announcement!',
      embeds: [{
        title: `Event: ${title}`,
        description,
        color: EMBED_COLORS.event,
        fields,
        footer: { text: 'Betta Warlords | Events' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook event error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/lore', requireAdmin, async (req, res) => {
  const { title, story, character } = req.body;
  if (!title || !story) return res.status(400).json({ error: 'Title and story required' });
  try {
    const fields = [];
    if (character) fields.push({ name: 'Featured Character', value: character, inline: true });
    await sendWebhookMessage({
      content: '## Lore Drop',
      embeds: [{
        title: `Lore: ${title}`,
        description: `*${story}*`,
        color: EMBED_COLORS.lore,
        fields,
        footer: { text: 'Betta Warlords | World Lore' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook lore error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/tip', requireAdmin, async (req, res) => {
  const { title, tip, category } = req.body;
  if (!title || !tip) return res.status(400).json({ error: 'Title and tip required' });
  try {
    const fields = [];
    if (category) fields.push({ name: 'Category', value: category, inline: true });
    await sendWebhookMessage({
      content: '## Warlord Tip of the Day',
      embeds: [{
        title: `Tip: ${title}`,
        description: tip,
        color: EMBED_COLORS.tip,
        fields,
        footer: { text: 'Betta Warlords | Tips & Tricks' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook tip error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/custom', requireAdmin, async (req, res) => {
  const { content, title, description, color, fields } = req.body;
  if (!content && !title) return res.status(400).json({ error: 'Content or title required' });
  try {
    const payload = {};
    if (content) payload.content = content;
    if (title) {
      payload.embeds = [{
        title,
        description: description || '',
        color: color || EMBED_COLORS.update,
        fields: fields || [],
        footer: { text: 'Betta Warlords' },
        timestamp: new Date().toISOString(),
      }];
    }
    await sendWebhookMessage(payload);
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook custom error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const arenaRateLimit = new Map();
app.post('/api/discord/webhook/arena', async (req, res) => {
  const { content, embeds } = req.body;
  if (!content && !embeds) return res.status(400).json({ error: 'Content or embeds required' });

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const lastPost = arenaRateLimit.get(ip) || 0;
  if (now - lastPost < 30000) {
    return res.status(429).json({ error: 'Please wait before sharing again' });
  }
  arenaRateLimit.set(ip, now);

  try {
    const payload = {};
    if (content) payload.content = content.slice(0, 200);
    if (embeds && Array.isArray(embeds)) {
      payload.embeds = embeds.slice(0, 1).map(e => ({
        ...e,
        title: (e.title || '').slice(0, 100),
        color: 0xef4444,
        footer: { text: 'Betta Warlords Arena | Grudge Studios' },
        timestamp: new Date().toISOString(),
      }));
    }
    await sendWebhookMessage(payload);
    res.json({ success: true });
  } catch (err) {
    console.error('Arena webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const SLASH_COMMANDS = [
  {
    name: 'warlords',
    description: 'Get info about Betta Warlords',
    options: [
      {
        name: 'action',
        description: 'What info to see',
        type: 3,
        required: true,
        choices: [
          { name: 'Play - Get the game link', value: 'play' },
          { name: 'Lore - The Three Vessels story', value: 'lore' },
          { name: 'Breeds - 8 Betta species info', value: 'breeds' },
          { name: 'Classes - 4 Warlord classes', value: 'classes' },
          { name: 'Arena - Arena battle info', value: 'arena' },
          { name: 'GBuX - Currency & economy', value: 'gbux' },
        ],
      },
    ],
  },
  {
    name: 'chat',
    description: 'Send a message to the Betta Warlords community chat',
    options: [
      {
        name: 'message',
        description: 'Your message to the community',
        type: 3,
        required: true,
      },
      {
        name: 'topic',
        description: 'Message topic',
        type: 3,
        required: false,
        choices: [
          { name: 'General', value: 'general' },
          { name: 'Strategy & Tips', value: 'strategy' },
          { name: 'Looking for Party', value: 'lfp' },
          { name: 'Lore Discussion', value: 'lore' },
          { name: 'Bug Report', value: 'bug' },
          { name: 'Suggestion', value: 'suggestion' },
        ],
      },
    ],
  },
];

async function registerSlashCommands() {
  if (!DISCORD_BOT_TOKEN || !BOT_APP_ID) {
    console.log('Skipping slash command registration: missing bot token or app ID');
    return;
  }
  try {
    const url = `https://discord.com/api/v10/applications/${BOT_APP_ID}/guilds/${GUILD_ID}/commands`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SLASH_COMMANDS),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Slash command registration failed:', res.status, err);
    } else {
      const data = await res.json();
      console.log(`Registered ${data.length} slash command(s) for guild ${GUILD_ID}`);
    }
  } catch (err) {
    console.error('Slash command registration error:', err.message);
  }
}

async function sendChatWebhook({ content, embeds, username, avatar_url }) {
  if (!DISCORD_WEBHOOK_CHAT) throw new Error('Chat webhook not configured');
  const payload = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  payload.username = username || 'Betta Warlords Chat';
  payload.avatar_url = avatar_url || 'https://grudgewarlords.com/icons/logo.png';
  const res = await fetch(DISCORD_WEBHOOK_CHAT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat webhook failed (${res.status}): ${err}`);
  }
  return true;
}

async function sendAnnounceWebhook({ content, embeds, username, avatar_url }) {
  if (!DISCORD_WEBHOOK_URL_ANNOUNCE) throw new Error('Announce webhook not configured');
  const payload = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  payload.username = username || 'Betta Warlords';
  payload.avatar_url = avatar_url || 'https://grudgewarlords.com/icons/logo.png';
  const res = await fetch(DISCORD_WEBHOOK_URL_ANNOUNCE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Announce webhook failed (${res.status}): ${err}`);
  }
  return true;
}

const ANNOUNCE_TYPES = {
  victory: { color: 0xfbbf24, emoji: '⚔️', title: 'Battle Victory' },
  boss_kill: { color: 0xff4500, emoji: '🔥', title: 'Boss Slain!' },
  level_up: { color: 0x22d3ee, emoji: '🌊', title: 'Level Up!' },
  challenge: { color: 0xef4444, emoji: '🏟️', title: 'Arena Challenge' },
  flawless: { color: 0xe6c300, emoji: '✨', title: 'Flawless Victory!' },
  hero_created: { color: 0x8b5cf6, emoji: '🐠', title: 'New Warlord Born' },
  milestone: { color: 0x4ade80, emoji: '🏆', title: 'Milestone Reached' },
};

const announceRateLimit = new Map();
app.post('/api/discord/webhook/announce', async (req, res) => {
  const { type, playerName, details } = req.body;
  if (!type || !playerName) return res.status(400).json({ error: 'Type and playerName required' });

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const rateKey = `${ip}:${type}`;
  const now = Date.now();
  const lastPost = announceRateLimit.get(rateKey) || 0;
  if (now - lastPost < 15000) {
    return res.status(429).json({ error: 'Please wait before announcing again' });
  }
  announceRateLimit.set(rateKey, now);

  const announceType = ANNOUNCE_TYPES[type] || ANNOUNCE_TYPES.victory;

  try {
    const fields = [];
    if (details?.warlord) fields.push({ name: 'Warlord', value: details.warlord, inline: true });
    if (details?.level) fields.push({ name: 'Level', value: `${details.level}`, inline: true });
    if (details?.location) fields.push({ name: 'Location', value: details.location, inline: true });
    if (details?.enemies) fields.push({ name: 'Enemies Defeated', value: `${details.enemies}`, inline: true });
    if (details?.boss) fields.push({ name: 'Boss', value: details.boss, inline: true });
    if (details?.heroParty) fields.push({ name: 'War Party', value: details.heroParty, inline: false });
    if (details?.xp) fields.push({ name: 'XP Gained', value: `${details.xp}`, inline: true });
    if (details?.pearls) fields.push({ name: 'Pearls Earned', value: `${details.pearls}`, inline: true });
    if (details?.record) fields.push({ name: 'Record', value: details.record, inline: true });
    if (details?.breed) fields.push({ name: 'Breed', value: details.breed, inline: true });
    if (details?.class) fields.push({ name: 'Class', value: details.class, inline: true });
    if (details?.milestone) fields.push({ name: 'Achievement', value: details.milestone, inline: false });

    await sendAnnounceWebhook({
      content: `${announceType.emoji} **${playerName.slice(0, 50)}** — ${announceType.title}`,
      embeds: [{
        title: `${announceType.emoji} ${announceType.title}`,
        color: announceType.color,
        fields: fields.slice(0, 10),
        footer: { text: 'Betta Warlords | Grudge Studios' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Announce webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const TOPIC_LABELS = {
  general: { label: 'General', color: 0x22d3ee, emoji: '💬' },
  strategy: { label: 'Strategy & Tips', color: 0xfbbf24, emoji: '⚔️' },
  lfp: { label: 'Looking for Party', color: 0x4ade80, emoji: '🎣' },
  lore: { label: 'Lore Discussion', color: 0x8b5cf6, emoji: '📜' },
  bug: { label: 'Bug Report', color: 0xef4444, emoji: '🐛' },
  suggestion: { label: 'Suggestion', color: 0x3b82f6, emoji: '💡' },
};

async function sendBotMessage(channelId, payload) {
  if (!DISCORD_BOT_TOKEN) throw new Error('Bot token not configured');
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bot message failed (${res.status}): ${err}`);
  }
  return res.json();
}

const COMMAND_RESPONSES = {
  play: {
    title: 'Play Betta Warlords',
    description: 'Dive into the underwater world of Betta Warlords — the flagship RPG from Grudge Studios!',
    color: 0x22d3ee,
    fields: [
      { name: 'Play Now', value: '[Launch Game](https://bettawarlords.replit.app)', inline: true },
      { name: 'Platform', value: 'Web / Mobile PWA', inline: true },
      { name: 'Price', value: 'Free to Play', inline: true },
      { name: 'Features', value: '32 unique Warlord combos, tactical battles, world map exploration, AI-powered dialogue, Discord integration', inline: false },
    ],
  },
  lore: {
    title: 'The Three Vessels of Magic',
    description: '*In the beginning, three currents of magic wove through the deep ocean, each carried by a Vessel chosen by the tides themselves...*',
    color: 0x8b5cf6,
    fields: [
      { name: 'Betta — Fire of Will', value: 'The Betta carry the flame of individual will — fierce, proud, and unyielding. Their magic manifests as raw combat power and elemental fury.', inline: false },
      { name: 'Gorgons — Weight of Law', value: 'The three Gorgon Sirens (Scylla, Medusa, Charybdis) once upheld the laws of the deep. When the Plankton Magic went silent, it shattered the Coral Crown and drove them mad.', inline: false },
      { name: 'Plankton — Light of Unity', value: 'The smallest creatures carried the greatest magic — unity itself. Their silence is the catalyst for the entire war. The Coral Crown lies shattered, and darkness spreads.', inline: false },
    ],
  },
  breeds: {
    title: 'The 8 Betta Breeds',
    description: 'Each breed draws from real IBC (International Betta Congress) standards:',
    color: 0xef4444,
    fields: [
      { name: 'Halfmoon', value: '180° tail spread, balanced stats', inline: true },
      { name: 'Crowntail', value: 'Spiked ray fins, high crit rate', inline: true },
      { name: 'Plakat', value: 'Short-finned fighters, high STR', inline: true },
      { name: 'Doubletail', value: 'Split caudal fin, dual-casting', inline: true },
      { name: 'Giant', value: 'Oversized lineage, raw power', inline: true },
      { name: 'Dragonscale', value: 'Thick metallic scales, armor', inline: true },
      { name: 'Butterfly', value: 'Banded fin patterns, evasion', inline: true },
      { name: 'Cambodian', value: 'Pale body, dark fins, mystic affinity', inline: true },
    ],
  },
  classes: {
    title: 'The 4 Warlord Classes',
    description: 'Choose your path in the underwater battlefield:',
    color: 0xfbbf24,
    fields: [
      { name: 'Bruiser', value: 'Front-line tank with heavy melee damage. Skills: Tidal Crash, Iron Shell, Depth Charge.', inline: false },
      { name: 'Mystic', value: 'Magical caster with healing and elemental spells. Skills: Abyssal Bolt, Coral Mend, Maelstrom.', inline: false },
      { name: 'Vesselist', value: 'Vessel-magic specialist with buffs and debuffs. Skills: Current Shift, Coral Crown, Deep Link.', inline: false },
      { name: 'Scraper', value: 'Agile ranged fighter with stealth and precision. Skills: Fin Blade, Shadow Dart, Riptide Barrage.', inline: false },
    ],
  },
  arena: {
    title: 'The Arena',
    description: 'Test your War Party in the ancient underwater colosseum!',
    color: 0xef4444,
    fields: [
      { name: 'How It Works', value: 'Challenge arena tiers with your War Party (up to 6 heroes). Face waves of enemies with increasing difficulty.', inline: false },
      { name: 'Discord Integration', value: 'Arena results are broadcast here! Share your stats and compete with other Warlords.', inline: false },
      { name: 'Rewards', value: 'Pearls, XP, loot drops, and bragging rights.', inline: false },
    ],
  },
  gbux: {
    title: 'GBuX — Grudge Studios Currency',
    description: 'The universal currency across all Grudge Studios titles and AI tools.',
    color: 0xfbbf24,
    fields: [
      { name: 'Earn GBuX', value: 'Play Betta Warlords — the ONLY entry point to early-stage GBuX.', inline: false },
      { name: 'cNFT Breeding', value: '32 base Warlord types (8 breeds × 4 classes) as compressed NFTs on-chain.', inline: false },
      { name: 'Grudge Ecosystem', value: 'GBuX connects all Grudge Studios products: games, AI tools, and creator platforms.', inline: false },
    ],
  },
};

app.post('/api/discord/interactions', verifyKeyMiddleware(DISCORD_PUBLIC_KEY), async (req, res) => {
  const { type, data, member } = req.body;

  if (type === InteractionType.PING) {
    return res.json({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND && data?.name === 'warlords') {
    const action = data.options?.[0]?.value || 'play';
    const embed = COMMAND_RESPONSES[action] || COMMAND_RESPONSES.play;
    return res.json({
      type: 4,
      data: {
        embeds: [{
          ...embed,
          footer: { text: 'Betta Warlords | Grudge Studios' },
          timestamp: new Date().toISOString(),
        }],
      },
    });
  }

  if (type === InteractionType.APPLICATION_COMMAND && data?.name === 'chat') {
    const message = data.options?.find(o => o.name === 'message')?.value || '';
    const topicKey = data.options?.find(o => o.name === 'topic')?.value || 'general';
    const topic = TOPIC_LABELS[topicKey] || TOPIC_LABELS.general;
    const username = member?.user?.global_name || member?.user?.username || 'Warlord';
    const avatarHash = member?.user?.avatar;
    const userId = member?.user?.id;
    const avatarUrl = avatarHash && userId
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`
      : null;

    try {
      await sendChatWebhook({
        embeds: [{
          description: message,
          color: topic.color,
          author: {
            name: `${topic.emoji} ${username}`,
            icon_url: avatarUrl || undefined,
          },
          footer: { text: `${topic.label} | Betta Warlords Chat` },
          timestamp: new Date().toISOString(),
        }],
        username: `${username} — Betta Warlords`,
        avatar_url: avatarUrl || undefined,
      });
      return res.json({
        type: 4,
        data: {
          content: `${topic.emoji} Your message was posted to <#${CHAT_CHANNEL_ID}>!`,
          flags: 64,
        },
      });
    } catch (err) {
      console.error('Chat command error:', err.message);
      return res.json({
        type: 4,
        data: {
          content: 'Failed to send message. Please try again later.',
          flags: 64,
        },
      });
    }
  }

  res.json({ type: 4, data: { content: 'Unknown command' } });
});

app.post('/api/discord/bot/send', requireAdmin, async (req, res) => {
  const { content, embeds, channelId } = req.body;
  if (!content && !embeds) return res.status(400).json({ error: 'Content or embeds required' });
  try {
    const result = await sendBotMessage(channelId || BOT_CHANNEL_ID, { content, embeds });
    res.json({ success: true, messageId: result.id });
  } catch (err) {
    console.error('Bot send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Discord API server running on port ${PORT}`);
  registerSlashCommands();
});
