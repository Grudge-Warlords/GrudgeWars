import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export const ASSET_DIRS = {
  root: ROOT_DIR,
  publicDir: path.join(ROOT_DIR, 'public'),
  attachedDir: path.join(ROOT_DIR, 'attached_assets'),
  storageDir: path.join(ROOT_DIR, 'storage'),
  archivesDir: path.join(ROOT_DIR, 'storage', 'archives', 'attached'),
  extractedDir: path.join(ROOT_DIR, 'storage', 'extracted', 'attached'),
  manifestsDir: path.join(ROOT_DIR, 'storage', 'manifests'),
  catalogDir: path.join(ROOT_DIR, 'storage', 'catalog'),
  uploadDir: path.join(ROOT_DIR, 'storage', 'uploads'),
  objectStoreDir: path.join(ROOT_DIR, 'storage', 'object-store', 'grudge-studio'),
};

const RESERVED_API_PREFIXES = [
  '/api',
  '/api/auth',
  '/api/account',
  '/api/assets',
  '/api/gbux',
  '/api/discord',
  '/api/xai',
];

const CATEGORY_RULES = [
  ['characters', /(character|hero|fighter|knight|orc|goblin|zombie|skeleton|barbarian|dwar|elf|human|mage|warrior|ranger|worge|enemy)/i],
  ['weapons', /(weapon|sword|gun|rifle|bow|arrow|shield|spear|axe|hammer|dagger)/i],
  ['effects', /(effect|explosion|smoke|fire|magic|slash|blood|fx|particle)/i],
  ['ui', /(ui|icon|hud|button|panel|avatar|cursor|logo)/i],
  ['environment', /(tileset|tile|tree|rock|stone|forest|dungeon|ruin|bridge|terrain|map|background|house|tower|camp|obstacle|object|nature)/i],
  ['audio', /(sound|audio|music|voice)/i],
  ['video', /(video|cinematic|trailer|promo)/i],
  ['models', /\.(glb|gltf|fbx|obj|mtl|vox)$/i],
];

export function ensureAssetStorageLayout() {
  Object.values(ASSET_DIRS).forEach((dir) => {
    if (dir.includes(ROOT_DIR) && !path.extname(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function slugify(input) {
  return String(input)
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function classifyAsset(input) {
  const target = String(input);
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(target)) return category;
  }
  return 'misc';
}

function walkFiles(dir, baseDir = dir, accumulator = []) {
  if (!fs.existsSync(dir)) return accumulator;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, baseDir, accumulator);
    } else if (entry.isFile()) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const ext = path.extname(entry.name).toLowerCase() || '(none)';
      accumulator.push({
        name: entry.name,
        ext,
        fullPath,
        relativePath,
        size: fs.statSync(fullPath).size,
      });
    }
  }
  return accumulator;
}

function summarizeFiles(files, scope) {
  const byExt = {};
  const byTopLevel = {};
  for (const file of files) {
    byExt[file.ext] = (byExt[file.ext] || 0) + 1;
    const top = file.relativePath.split('/')[0] || '(root)';
    byTopLevel[top] = (byTopLevel[top] || 0) + 1;
  }
  return {
    scope,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    byExt,
    byTopLevel,
  };
}

function scanArchives() {
  if (!fs.existsSync(ASSET_DIRS.attachedDir)) return [];
  return fs.readdirSync(ASSET_DIRS.attachedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && ['.zip', '.rar'].includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const fullPath = path.join(ASSET_DIRS.attachedDir, entry.name);
      const stat = fs.statSync(fullPath);
      const category = classifyAsset(entry.name);
      return {
        name: entry.name,
        ext: path.extname(entry.name).toLowerCase(),
        size: stat.size,
        category,
        slug: slugify(entry.name),
        sourcePath: fullPath,
        extractTarget: path.join(ASSET_DIRS.extractedDir, category, slugify(entry.name)),
      };
    });
}

export function detectAssetConflicts() {
  const conflicts = [];
  const staticApiDir = path.join(ASSET_DIRS.publicDir, 'api');
  if (fs.existsSync(staticApiDir)) {
    conflicts.push({
      type: 'static-api-path',
      severity: 'high',
      path: 'public/api',
      message: 'Static assets under public/api conflict with backend /api namespace and asset routes.',
      recommendation: 'Move static api content to public/content or public/site and redirect callers.',
    });
  }

  for (const route of RESERVED_API_PREFIXES) {
    const routeDir = path.join(ASSET_DIRS.publicDir, route.replace(/^\//, ''));
    if (fs.existsSync(routeDir)) {
      conflicts.push({
        type: 'reserved-route',
        severity: 'high',
        path: routeDir,
        message: `Public path collides with reserved backend namespace ${route}.`,
        recommendation: 'Remove or rename the public directory.',
      });
    }
  }

  return conflicts;
}

export function buildAssetCatalog({ write = true } = {}) {
  ensureAssetStorageLayout();

  const publicFiles = walkFiles(ASSET_DIRS.publicDir);
  const extractedFiles = walkFiles(ASSET_DIRS.extractedDir);
  const archives = scanArchives();

  const publicSummary = summarizeFiles(publicFiles, 'public');
  const extractedSummary = summarizeFiles(extractedFiles, 'extracted');
  const archiveSummary = {
    scope: 'archives',
    fileCount: archives.length,
    totalBytes: archives.reduce((sum, file) => sum + file.size, 0),
    byExt: archives.reduce((acc, item) => ({ ...acc, [item.ext]: (acc[item.ext] || 0) + 1 }), {}),
    byCategory: archives.reduce((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + 1 }), {}),
  };

  const catalog = {
    generatedAt: new Date().toISOString(),
    roots: ASSET_DIRS,
    summaries: {
      public: publicSummary,
      extracted: extractedSummary,
      archives: archiveSummary,
    },
    conflicts: detectAssetConflicts(),
    archives,
    samplePublicFiles: publicFiles.slice(0, 250),
    sampleExtractedFiles: extractedFiles.slice(0, 250),
  };

  if (write) {
    fs.writeFileSync(path.join(ASSET_DIRS.catalogDir, 'asset-catalog.json'), JSON.stringify(catalog, null, 2));
    fs.writeFileSync(path.join(ASSET_DIRS.manifestsDir, 'public-assets.manifest.json'), JSON.stringify(publicSummary, null, 2));
    fs.writeFileSync(path.join(ASSET_DIRS.manifestsDir, 'attached-archives.manifest.json'), JSON.stringify(archiveSummary, null, 2));
    fs.writeFileSync(path.join(ASSET_DIRS.manifestsDir, 'extracted-assets.manifest.json'), JSON.stringify(extractedSummary, null, 2));
    fs.writeFileSync(path.join(ASSET_DIRS.manifestsDir, 'asset-conflicts.json'), JSON.stringify(catalog.conflicts, null, 2));
  }

  return catalog;
}

function recommendedStorageKey(scope, relativePath, fallbackCategory = 'misc') {
  const rel = relativePath.replace(/\\/g, '/');
  const top = rel.split('/')[0];
  const category = top && top !== '(root)' ? top : fallbackCategory;
  if (scope === 'public') return `public/${rel}`;
  if (scope === 'archive') return `archives/attached/${category}/${rel}`;
  return `attached/extracted/${category}/${rel}`;
}

export function buildUploadManifest({ write = true } = {}) {
  ensureAssetStorageLayout();
  const publicFiles = walkFiles(ASSET_DIRS.publicDir);
  const extractedFiles = walkFiles(ASSET_DIRS.extractedDir);
  const archives = scanArchives();

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: 'grudge-studio',
    basePublicUrl: 'https://assets.grudge-studio.com',
    entries: [
      ...publicFiles.map((file) => ({
        scope: 'public',
        sourcePath: file.fullPath,
        relativePath: file.relativePath,
        key: recommendedStorageKey('public', file.relativePath),
        contentTypeHint: file.ext,
      })),
      ...extractedFiles.map((file) => ({
        scope: 'extracted',
        sourcePath: file.fullPath,
        relativePath: file.relativePath,
        key: recommendedStorageKey('extracted', file.relativePath, classifyAsset(file.relativePath)),
        contentTypeHint: file.ext,
      })),
      ...archives.map((file) => ({
        scope: 'archive',
        sourcePath: file.sourcePath,
        relativePath: file.name,
        key: recommendedStorageKey('archive', `${file.category}/${file.name}`, file.category),
        contentTypeHint: file.ext,
      })),
    ],
  };

  if (write) {
    fs.writeFileSync(path.join(ASSET_DIRS.uploadDir, 'upload-manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(ASSET_DIRS.objectStoreDir, 'index.json'), JSON.stringify({
      generatedAt: manifest.generatedAt,
      bucket: manifest.bucket,
      basePublicUrl: manifest.basePublicUrl,
      entries: manifest.entries.length,
    }, null, 2));
  }

  return manifest;
}

export function readAssetManifest(name) {
  const safeName = path.basename(name);
  const candidates = [
    path.join(ASSET_DIRS.manifestsDir, safeName),
    path.join(ASSET_DIRS.catalogDir, safeName),
    path.join(ASSET_DIRS.uploadDir, safeName),
    path.join(ASSET_DIRS.objectStoreDir, safeName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    }
  }
  return null;
}

export function assetStorageConfig() {
  return {
    bucket: 'grudge-studio',
    basePublicUrl: 'https://assets.grudge-studio.com',
    apiBase: '/api/assets',
    roots: {
      public: ASSET_DIRS.publicDir,
      attached: ASSET_DIRS.attachedDir,
      extracted: ASSET_DIRS.extractedDir,
      manifests: ASSET_DIRS.manifestsDir,
      objectStore: ASSET_DIRS.objectStoreDir,
    },
    namespaces: {
      public: 'public/*',
      archives: 'archives/attached/*',
      extracted: 'attached/extracted/*',
      manifests: 'manifests/*',
    },
  };
}
