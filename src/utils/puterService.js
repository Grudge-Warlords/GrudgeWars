const getPuter = () => typeof window !== 'undefined' && window.puter ? window.puter : null;

export const puterAuth = {
  isSignedIn() {
    const p = getPuter();
    if (!p) return false;
    try { return p.auth.isSignedIn(); } catch { return false; }
  },

  async signIn() {
    const p = getPuter();
    if (!p) throw new Error('Puter SDK not loaded');
    const res = await p.auth.signIn();
    return res;
  },

  signOut() {
    const p = getPuter();
    if (!p) return;
    p.auth.signOut();
  },

  async getUser() {
    const p = getPuter();
    if (!p) return null;
    try {
      const user = await p.auth.getUser();
      return user;
    } catch { return null; }
  },
};

export const puterAI = {
  async chat(prompt, options = {}) {
    const p = getPuter();
    if (!p) throw new Error('Puter SDK not loaded');
    const defaultOpts = { model: 'gpt-5-nano', ...options };
    const resp = await p.ai.chat(prompt, defaultOpts);
    return resp;
  },

  async chatStream(prompt, options = {}) {
    const p = getPuter();
    if (!p) throw new Error('Puter SDK not loaded');
    const defaultOpts = { model: 'gpt-5-nano', stream: true, ...options };
    const resp = await p.ai.chat(prompt, defaultOpts);
    return resp;
  },

  async generateLore(context) {
    const systemPrompt = `You are a lore master for "Betta Warlords," an underwater freshwater RPG set in the Sunken Kingdom of Abyssia. Generate short, atmospheric lore snippets (2-3 sentences max). Use underwater/freshwater themes: roots, currents, betta fish, aquatic creatures, deep trenches. Keep it mysterious and epic.`;
    const resp = await puterAI.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context },
    ]);
    return typeof resp === 'string' ? resp : resp?.message?.content || resp?.toString() || '';
  },

  async battleNarration(attacker, defender, ability, damage) {
    const prompt = `In 1 short sentence, narrate this RPG battle action: ${attacker} uses ${ability} on ${defender} for ${damage} damage. Underwater freshwater theme.`;
    const resp = await puterAI.chat(prompt);
    return typeof resp === 'string' ? resp : resp?.message?.content || resp?.toString() || '';
  },

  async npcDialogue(npcName, context) {
    const prompt = `You are ${npcName}, an NPC in an underwater betta fish RPG. Respond in 1-2 sentences. Context: ${context}`;
    const resp = await puterAI.chat(prompt);
    return typeof resp === 'string' ? resp : resp?.message?.content || resp?.toString() || '';
  },
};

export const puterKV = {
  async save(key, value) {
    const p = getPuter();
    if (!p) return false;
    try {
      await p.kv.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch { return false; }
  },

  async load(key) {
    const p = getPuter();
    if (!p) return null;
    try {
      const val = await p.kv.get(key);
      if (val === null || val === undefined) return null;
      try { return JSON.parse(val); } catch { return val; }
    } catch { return null; }
  },

  async remove(key) {
    const p = getPuter();
    if (!p) return false;
    try {
      await p.kv.del(key);
      return true;
    } catch { return false; }
  },

  async listKeys() {
    const p = getPuter();
    if (!p) return [];
    try {
      const keys = await p.kv.list();
      return keys || [];
    } catch { return []; }
  },
};

export function isPuterAvailable() {
  return !!getPuter();
}
