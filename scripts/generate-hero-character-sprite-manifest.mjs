#!/usr/bin/env node
/**
 * Generate the heroCharacterSprites.json dataset for Grudge ObjectStore.
 *
 * Output contract: one entry per (raceId, classId) — 6 races × 4 classes = 24.
 * Every entry embeds the full sprite-sheet definition with absolute URLs
 * rooted at the ObjectStore origin so any external 2D Grudge game can
 * consume the manifest directly without additional rebasing.
 *
 * Usage:
 *   node scripts/generate-hero-character-sprite-manifest.mjs [--out <path>]
 *
 * Default output: <repo-root>/api/v1/heroCharacterSprites.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const outFlagIdx = args.indexOf('--out');
const outArg = outFlagIdx >= 0 ? args[outFlagIdx + 1] : null;

if (outFlagIdx >= 0 && !outArg) {
  console.error('Usage: node scripts/generate-hero-character-sprite-manifest.mjs [--out <path>]');
  console.error('Error: `--out` requires a path argument.');
  process.exit(1);
}

const outPath = outFlagIdx >= 0
  ? resolve(outArg)
  : resolve(__dirname, '..', 'api', 'v1', 'heroCharacterSprites.json');

const OBJECT_STORE_ORIGIN = process.env.OBJECT_STORE_ORIGIN || 'https://molochdagod.github.io/ObjectStore';

// ── Load source mapping ──────────────────────────────────────────────────────
const spriteMapUrl = pathToFileURL(resolve(__dirname, '..', 'src', 'data', 'spriteMap.js')).href;
const spriteMap = await import(spriteMapUrl);

const {
  raceClassSpriteMap,
  raceClassDefaultSpriteKeys = {},
  raceClassDefaultProps = {},
} = spriteMap;

if (!raceClassSpriteMap) {
  throw new Error('Could not import raceClassSpriteMap from spriteMap.js');
}

const RACES = Object.keys(raceClassSpriteMap);          // ['human','orc','elf','undead','barbarian','dwarf']
const CLASSES = ['warrior', 'mage', 'worge', 'ranger']; // canonical class order

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Rewrite a sheet object's animation `src` paths to absolute ObjectStore URLs. */
function absolutiseSheet(sheet) {
  const out = {};
  for (const [key, val] of Object.entries(sheet)) {
    if (val && typeof val === 'object' && typeof val.src === 'string' && val.src.startsWith('/')) {
      out[key] = { ...val, src: `${OBJECT_STORE_ORIGIN}${val.src}` };
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Extract the visual-override props (filter / scale / dwarfTransform) from a sheet entry. */
function pickProps(sheet) {
  const { filter, scale, dwarfTransform, transformScaleMult, facesLeft } = sheet;
  const props = {};
  if (filter) props.filter = filter;
  if (scale !== undefined) props.scale = scale;
  if (dwarfTransform) props.dwarfTransform = dwarfTransform;
  if (transformScaleMult !== undefined) props.transformScaleMult = transformScaleMult;
  if (facesLeft !== undefined) props.facesLeft = facesLeft;
  return props;
}

// ── Build mappings ───────────────────────────────────────────────────────────
const mappings = [];
for (const raceId of RACES) {
  for (const classId of CLASSES) {
    const sheet = raceClassSpriteMap[raceId]?.[classId];
    if (!sheet) {
      console.warn(`[warn] Missing race/class sheet: ${raceId}/${classId}`);
      continue;
    }
    const spriteKey = raceClassDefaultSpriteKeys?.[raceId]?.[classId] || null;
    const overrideProps = raceClassDefaultProps?.[raceId]?.[classId] || {};
    mappings.push({
      id: `${raceId}-${classId}`,
      raceId,
      classId,
      spriteKey,
      props: { ...pickProps(sheet), ...overrideProps },
      sheet: absolutiseSheet(sheet),
    });
  }
}

const manifest = {
  version: '1.0.0',
  updated: new Date().toISOString().slice(0, 10),
  description: 'Grudge Warlords canonical 2D sprite mapping — every (race, class) combination has a dedicated sprite sheet. Consume this manifest from any 2D Grudge game to render the correct character animation set.',
  origin: OBJECT_STORE_ORIGIN,
  total: mappings.length,
  races: RACES,
  classes: CLASSES,
  mappings,
};

// ── Write ────────────────────────────────────────────────────────────────────
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`✓ Wrote ${mappings.length} mappings to ${outPath}`);
console.log(`  origin: ${OBJECT_STORE_ORIGIN}`);
console.log(`  races:  ${RACES.join(', ')}`);
console.log(`  classes:${CLASSES.join(', ')}`);
