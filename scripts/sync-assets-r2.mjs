/**
 * sync-assets-r2.mjs
 * Upload public/ directory to Cloudflare R2 under the rpg-modular/ prefix.
 *
 * Required env vars (set in .env or shell):
 *   R2_ACCESS_KEY_ID      — R2 API token ID
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_BUCKET             — bucket name (e.g. grudge-assets)
 *   R2_ENDPOINT           — https://<accountid>.r2.cloudflarestorage.com
 *
 * Optional:
 *   R2_PREFIX             — key prefix (default: rpg-modular)
 *   SYNC_DIR              — local dir to sync (default: ./public)
 *   DRY_RUN=1             — list files without uploading
 *
 * Usage:
 *   npm run assets:sync
 *   DRY_RUN=1 npm run assets:sync
 */

import {
  S3Client, PutObjectCommand, HeadObjectCommand,
  CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { createReadStream, statSync, readFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- Config ---
const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_ENDPOINT,
  R2_PREFIX = 'rpg-modular',
  SYNC_DIR = path.join(ROOT, 'public'),
  DRY_RUN,
} = process.env;

if (!DRY_RUN && (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_ENDPOINT)) {
  console.error('Missing required env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT');
  console.error('Add them to your .env file or shell environment.');
  process.exit(1);
}

const MIME_MAP = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx':  'application/octet-stream',
  '.bin':  'application/octet-stream',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function md5File(filePath) {
  const buf = readFileSync(filePath);
  return createHash('md5').update(buf).digest('hex');
}

async function main() {
  const files = await walkDir(SYNC_DIR);
  const total = files.length;
  console.log(`\nFound ${total} files in ${SYNC_DIR}`);
  console.log(`Target: s3://${R2_BUCKET}/${R2_PREFIX}/\n`);

  if (DRY_RUN) {
    files.slice(0, 20).forEach(f => {
      const rel = path.relative(SYNC_DIR, f).replace(/\\/g, '/');
      console.log(`  [DRY] ${R2_PREFIX}/${rel}`);
    });
    if (total > 20) console.log(`  ... and ${total - 20} more`);
    return;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const MULTIPART_THRESHOLD = 20 * 1024 * 1024; // 20 MB
  const PART_SIZE = 10 * 1024 * 1024; // 10 MB parts
  const MAX_RETRIES = 3;
  const cacheControl = (ct) =>
    ct.startsWith('image/') || ct.startsWith('audio/') || ct.startsWith('video/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

  async function uploadMultipart(key, filePath, contentType, fileSize) {
    const buf = await readFile(filePath);
    const { UploadId } = await client.send(new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET, Key: key, ContentType: contentType,
      CacheControl: cacheControl(contentType),
    }));
    const parts = [];
    let offset = 0;
    let partNum = 1;
    while (offset < fileSize) {
      const slice = buf.slice(offset, offset + PART_SIZE);
      const { ETag } = await client.send(new UploadPartCommand({
        Bucket: R2_BUCKET, Key: key, UploadId, PartNumber: partNum, Body: slice,
      }));
      parts.push({ ETag, PartNumber: partNum });
      offset += PART_SIZE;
      partNum++;
    }
    await client.send(new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET, Key: key, UploadId,
      MultipartUpload: { Parts: parts },
    }));
  }

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    // Skip if file disappeared (e.g. temp files)
    if (!existsSync(filePath)) { skipped++; continue; }

    let fileSize;
    try { fileSize = statSync(filePath).size; } catch { skipped++; continue; }

    const rel = path.relative(SYNC_DIR, filePath).replace(/\\/g, '/');
    const key = `${R2_PREFIX}/${rel}`;
    const contentType = mimeFor(filePath);
    const pct = Math.round(((i + 1) / total) * 100);

    // Skip check: compare ETag (MD5) with existing object
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      const localMd5 = md5File(filePath);
      const remoteEtag = (head.ETag || '').replace(/"/g, '');
      if (remoteEtag === localMd5) {
        process.stdout.write(`\r[${pct}%] ${i + 1}/${total} ⏩ ${rel}`);
        skipped++;
        continue;
      }
    } catch {
      // Object doesn't exist, upload it
    }

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (fileSize > MULTIPART_THRESHOLD) {
          await uploadMultipart(key, filePath, contentType, fileSize);
        } else {
          await client.send(new PutObjectCommand({
            Bucket: R2_BUCKET, Key: key,
            Body: createReadStream(filePath),
            ContentType: contentType, ContentLength: fileSize,
            CacheControl: cacheControl(contentType),
          }));
        }
        success = true;
        break;
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * attempt)); // back-off
        } else {
          console.error(`\n  ✗ Failed (${MAX_RETRIES} attempts): ${rel} — ${err.message}`);
        }
      }
    }
    if (success) {
      process.stdout.write(`\r[${pct}%] ${i + 1}/${total} ✓ ${rel}                    `);
      uploaded++;
    } else {
      failed++;
    }
  }

  console.log(`\n\nDone. Uploaded: ${uploaded}  Skipped (unchanged): ${skipped}  Failed: ${failed}`);
  console.log(`\nAssets live at: ${R2_ENDPOINT?.replace(/\.r2\.cloudflarestorage\.com.*/, '')} → https://assets.grudge-studio.com/${R2_PREFIX}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
