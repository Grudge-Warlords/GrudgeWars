import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  ASSET_DIRS,
  buildAssetCatalog,
  buildUploadManifest,
  classifyAsset,
  ensureAssetStorageLayout,
  slugify,
} from '../src/services/assetStorageService.js';

ensureAssetStorageLayout();

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const limitArg = [...args].find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const possible7z = [
  process.env.SEVEN_ZIP_PATH,
  'C:\\Program Files\\7-Zip\\7z.exe',
  'C:\\Program Files (x86)\\7-Zip\\7z.exe',
].filter(Boolean);

const sevenZip = possible7z.find((candidate) => fs.existsSync(candidate));
if (!sevenZip) {
  console.error('7-Zip not found. Set SEVEN_ZIP_PATH or install 7-Zip.');
  process.exit(1);
}

const archives = fs.readdirSync(ASSET_DIRS.attachedDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && ['.zip', '.rar'].includes(path.extname(entry.name).toLowerCase()))
  .slice(0, limit ?? undefined);

const results = [];

for (const entry of archives) {
  const archivePath = path.join(ASSET_DIRS.attachedDir, entry.name);
  const category = classifyAsset(entry.name);
  const slug = slugify(entry.name);
  const destDir = path.join(ASSET_DIRS.extractedDir, category, slug);
  fs.mkdirSync(destDir, { recursive: true });

  const existingFiles = fs.existsSync(destDir) ? fs.readdirSync(destDir) : [];
  if (existingFiles.length > 0 && !force) {
    results.push({ archive: entry.name, category, status: 'skipped', reason: 'already-extracted', destDir });
    continue;
  }

  const extractResult = spawnSync(sevenZip, ['x', archivePath, `-o${destDir}`, '-y'], {
    encoding: 'utf8',
    stdio: 'pipe',
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20,
  });

  results.push({
    archive: entry.name,
    category,
    status: extractResult.status === 0 ? 'extracted' : 'failed',
    code: extractResult.status,
    destDir,
    stderr: extractResult.stderr?.slice(0, 4000) || '',
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  sevenZip,
  totalArchivesProcessed: results.length,
  extracted: results.filter((item) => item.status === 'extracted').length,
  skipped: results.filter((item) => item.status === 'skipped').length,
  failed: results.filter((item) => item.status === 'failed').length,
  results,
};

fs.writeFileSync(
  path.join(ASSET_DIRS.manifestsDir, 'attached-extraction-results.json'),
  JSON.stringify(summary, null, 2),
);

buildAssetCatalog({ write: true });
buildUploadManifest({ write: true });

console.log(JSON.stringify({
  extracted: summary.extracted,
  skipped: summary.skipped,
  failed: summary.failed,
  manifest: path.join(ASSET_DIRS.manifestsDir, 'attached-extraction-results.json'),
}, null, 2));
