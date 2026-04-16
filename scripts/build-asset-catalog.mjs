import {
  buildAssetCatalog,
  buildUploadManifest,
  ensureAssetStorageLayout,
} from '../src/services/assetStorageService.js';

ensureAssetStorageLayout();
const catalog = buildAssetCatalog({ write: true });
const uploadManifest = buildUploadManifest({ write: true });

console.log(JSON.stringify({
  generatedAt: catalog.generatedAt,
  publicFiles: catalog.summaries.public.fileCount,
  extractedFiles: catalog.summaries.extracted.fileCount,
  archives: catalog.summaries.archives.fileCount,
  conflicts: catalog.conflicts.length,
  uploadEntries: uploadManifest.entries.length,
}, null, 2));
