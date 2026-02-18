const IMAGE_TYPES = {
  background: {
    label: 'World Background',
    promptTemplate: (theme, setting) =>
      `Fantasy RPG game background, ${setting}, ${theme} theme, atmospheric, epic landscape, highly detailed digital art, game art style, wide panoramic view, cinematic lighting, no text, no UI elements`,
  },
  battleBg: {
    label: 'Battle Arena',
    promptTemplate: (theme, setting) =>
      `RPG battle arena scene, ${theme} theme, ${setting}, dramatic lighting, game background, detailed environment, wide shot, no characters, no text, digital painting`,
  },
  cardBg: {
    label: 'Card Background',
    promptTemplate: (theme, setting) =>
      `Ornate card border frame design, ${theme} theme, decorative RPG trading card background, intricate borders, mystical glowing edges, dark background, no text, game UI art`,
  },
  titleBg: {
    label: 'Title Screen',
    promptTemplate: (theme, setting) =>
      `Epic ${theme} title screen background, ${setting}, dramatic cinematic composition, fantasy RPG game art, atmospheric fog and lighting, highly detailed, dark and moody, no text, digital painting`,
  },
  mapBg: {
    label: 'World Map',
    promptTemplate: (theme, setting) =>
      `Top-down fantasy world map, ${theme} theme, ${setting}, illustrated cartography style, parchment texture, distinct regions, RPG game map, detailed terrain, birds eye view, digital art, no text no labels`,
  },
  portrait: {
    label: 'Character Portrait',
    promptTemplate: (theme, race, className) =>
      `RPG character portrait, ${race} ${className}, ${theme} theme, fantasy game art, detailed face, dramatic lighting, painterly style, game avatar, no text`,
  },
  boss: {
    label: 'Boss Portrait',
    promptTemplate: (theme, bossName, bossDesc) =>
      `Epic RPG boss creature, ${bossName}, ${bossDesc}, ${theme} theme, menacing, powerful, dramatic dark lighting, fantasy game art, detailed, no text`,
  },
  icon: {
    label: 'Ability Icon',
    promptTemplate: (theme, abilityName) =>
      `RPG ability icon, ${abilityName}, ${theme} theme, glowing magical effect, game UI icon style, dark background, circular frame, detailed, no text`,
  },
};

async function generateImage(prompt, options = {}) {
  if (typeof window === 'undefined' || !window.puter) {
    return null;
  }

  try {
    const result = await puter.ai.txt2img(prompt, {
      model: options.model || 'dall-e-3',
      ...options,
    });

    if (typeof result === 'string') {
      return result;
    }

    if (result instanceof HTMLImageElement || (result && result.tagName === 'IMG')) {
      return result.src || result.getAttribute('src');
    }

    if (result instanceof Blob) {
      return URL.createObjectURL(result);
    }

    if (result && typeof result === 'object') {
      if (result.src) return result.src;
      if (result.url) return result.url;
      if (result.data) {
        if (typeof result.data === 'string') return result.data;
        if (result.data instanceof Blob) return URL.createObjectURL(result.data);
      }
    }

    return null;
  } catch (e) {
    console.warn('Image generation failed:', e.message || e);
    return null;
  }
}

export async function generateGameImages(form, spec, onProgress) {
  const theme = form.theme || 'Fantasy';
  const setting = form.setting || 'a magical world';
  const results = {};

  const imageJobs = [
    { key: 'background', label: 'world background', prompt: IMAGE_TYPES.background.promptTemplate(theme, setting) },
    { key: 'battleBg', label: 'battle arena', prompt: IMAGE_TYPES.battleBg.promptTemplate(theme, setting) },
    { key: 'cardBg', label: 'card design', prompt: IMAGE_TYPES.cardBg.promptTemplate(theme, setting) },
    { key: 'titleBg', label: 'title screen', prompt: IMAGE_TYPES.titleBg.promptTemplate(theme, setting) },
    { key: 'mapBg', label: 'world map', prompt: IMAGE_TYPES.mapBg.promptTemplate(theme, setting) },
  ];

  for (const job of imageJobs) {
    onProgress?.(`Generating ${job.label} image...`);
    const src = await generateImage(job.prompt);
    if (src) {
      results[job.key] = src;
    }
  }

  if (spec?.bosses?.length > 0) {
    const boss = spec.bosses[0];
    onProgress?.(`Generating boss portrait: ${boss.name}...`);
    const bossPrompt = IMAGE_TYPES.boss.promptTemplate(theme, boss.name, boss.description || '');
    const bossSrc = await generateImage(bossPrompt);
    if (bossSrc) {
      results.bossPortrait = bossSrc;
    }
  }

  if (spec?.races?.length > 0 && spec?.classes?.length > 0) {
    const race = spec.races[0];
    const cls = spec.classes[0];
    onProgress?.(`Generating character portrait: ${race.name} ${cls.name}...`);
    const charPrompt = IMAGE_TYPES.portrait.promptTemplate(theme, race.name, cls.name);
    const charSrc = await generateImage(charPrompt);
    if (charSrc) {
      results.characterPortrait = charSrc;
    }
  }

  return results;
}

export async function generateSingleImage(type, params) {
  const template = IMAGE_TYPES[type];
  if (!template) return null;

  const prompt = template.promptTemplate(...params);
  return generateImage(prompt);
}

export { IMAGE_TYPES };
