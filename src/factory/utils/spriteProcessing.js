export function isSvgFile(filename) {
  return /\.svg$/i.test(filename);
}

export function isGifFile(filename) {
  return /\.gif$/i.test(filename);
}

export function isImageFile(filename) {
  return /\.(png|webp|jpg|jpeg|gif|svg|bmp)$/i.test(filename);
}

export function getSpriteFileExtensions() {
  return '.png,.webp,.jpg,.jpeg,.gif,.svg,.bmp';
}

export async function loadImageDimensions(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    };
    img.onerror = () => resolve({ width: 0, height: 0, url });
    img.src = url;
  });
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function getDivisors(n) {
  const divs = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      divs.push(i);
      if (i !== n / i) divs.push(n / i);
    }
  }
  return divs.sort((a, b) => a - b);
}

function scoreFrameSize(fw, fh, imgW, imgH) {
  let score = 0;
  const ratio = fw / fh;
  if (ratio >= 0.5 && ratio <= 2.0) score += 20;
  if (ratio >= 0.75 && ratio <= 1.5) score += 15;
  if (Math.abs(ratio - 1.0) < 0.1) score += 10;
  const commonSizes = [16, 24, 32, 48, 64, 80, 96, 100, 128, 150, 160, 192, 200, 256, 300, 320, 400, 512];
  if (commonSizes.includes(fw)) score += 12;
  if (commonSizes.includes(fh)) score += 12;
  const pow2 = [16, 32, 64, 128, 256, 512];
  if (pow2.includes(fw)) score += 8;
  if (pow2.includes(fh)) score += 8;
  if (fw >= 16 && fw <= 512) score += 10;
  if (fh >= 16 && fh <= 512) score += 10;
  if (fw < 8 || fh < 8) score -= 50;
  if (fw > imgW * 0.8 && fh > imgH * 0.8) score -= 20;
  const cols = imgW / fw;
  const rows = imgH / fh;
  const totalFrames = cols * rows;
  if (totalFrames >= 2 && totalFrames <= 64) score += 15;
  if (totalFrames >= 3 && totalFrames <= 16) score += 10;
  if (totalFrames > 100) score -= 15;
  if (totalFrames === 1) score -= 25;
  return score;
}

export function detectGridLayout(width, height) {
  if (width <= 0 || height <= 0) return { cols: 1, rows: 1, frameWidth: width, frameHeight: height, type: 'single_frame' };

  if (width <= 512 && height <= 512 && Math.abs(width - height) / Math.max(width, height) < 0.2) {
    return { cols: 1, rows: 1, frameWidth: width, frameHeight: height, type: 'single_frame' };
  }

  const candidates = [];

  if (width > height * 1.3) {
    if (width % height === 0) {
      const cols = width / height;
      if (cols >= 2 && cols <= 60) {
        candidates.push({ cols, rows: 1, frameWidth: height, frameHeight: height, type: 'horizontal_strip', score: scoreFrameSize(height, height, width, height) + 30 });
      }
    }
    const nearSquareCols = Math.round(width / height);
    if (nearSquareCols >= 2 && nearSquareCols <= 60) {
      const fw = Math.round(width / nearSquareCols);
      if (Math.abs(width - fw * nearSquareCols) <= 2) {
        candidates.push({ cols: nearSquareCols, rows: 1, frameWidth: fw, frameHeight: height, type: 'horizontal_strip', score: scoreFrameSize(fw, height, width, height) + 20 });
      }
    }
  }

  if (height > width * 1.3) {
    if (height % width === 0) {
      const rows = height / width;
      if (rows >= 2 && rows <= 60) {
        candidates.push({ cols: 1, rows, frameWidth: width, frameHeight: width, type: 'vertical_strip', score: scoreFrameSize(width, width, width, height) + 30 });
      }
    }
    const nearSquareRows = Math.round(height / width);
    if (nearSquareRows >= 2 && nearSquareRows <= 60) {
      const fh = Math.round(height / nearSquareRows);
      if (Math.abs(height - fh * nearSquareRows) <= 2) {
        candidates.push({ cols: 1, rows: nearSquareRows, frameWidth: width, frameHeight: fh, type: 'vertical_strip', score: scoreFrameSize(width, fh, width, height) + 20 });
      }
    }
  }

  const g = gcd(width, height);
  if (g >= 8) {
    const fw = g;
    const fh = g;
    const cols = width / fw;
    const rows = height / fh;
    if (cols * rows >= 2 && cols * rows <= 200) {
      const type = rows === 1 ? 'horizontal_strip' : cols === 1 ? 'vertical_strip' : 'grid';
      candidates.push({ cols, rows, frameWidth: fw, frameHeight: fh, type, score: scoreFrameSize(fw, fh, width, height) + 5 });
    }
  }

  const wDivs = getDivisors(width).filter(d => d >= 8 && d <= 512);
  const hDivs = getDivisors(height).filter(d => d >= 8 && d <= 512);

  for (const fw of wDivs) {
    const cols = width / fw;
    if (cols > 60) continue;
    candidates.push({ cols, rows: 1, frameWidth: fw, frameHeight: height, type: 'horizontal_strip', score: scoreFrameSize(fw, height, width, height) });
    for (const fh of hDivs) {
      const rows = height / fh;
      if (rows > 60 || (cols * rows < 2) || (cols * rows > 200)) continue;
      if (cols === 1 && rows === 1) continue;
      const type = rows === 1 ? 'horizontal_strip' : cols === 1 ? 'vertical_strip' : 'grid';
      candidates.push({ cols, rows, frameWidth: fw, frameHeight: fh, type, score: scoreFrameSize(fw, fh, width, height) });
    }
  }

  for (const fh of hDivs) {
    const rows = height / fh;
    if (rows <= 1 || rows > 60) continue;
    candidates.push({ cols: 1, rows, frameWidth: width, frameHeight: fh, type: 'vertical_strip', score: scoreFrameSize(width, fh, width, height) });
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (best.score > 0) {
      return { cols: best.cols, rows: best.rows, frameWidth: best.frameWidth, frameHeight: best.frameHeight, type: best.type };
    }
  }

  const ratio = width / height;
  if (ratio > 1.5) {
    const guessCols = Math.max(2, Math.round(ratio));
    const fw = Math.round(width / guessCols);
    return { cols: guessCols, rows: 1, frameWidth: fw, frameHeight: height, type: 'horizontal_strip' };
  }
  if (ratio < 0.67) {
    const guessRows = Math.max(2, Math.round(1 / ratio));
    const fh = Math.round(height / guessRows);
    return { cols: 1, rows: guessRows, frameWidth: width, frameHeight: fh, type: 'vertical_strip' };
  }

  return { cols: 1, rows: 1, frameWidth: width, frameHeight: height, type: 'single_frame' };
}

export async function detectFrameSeparators(imageBlob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const data = ctx.getImageData(0, 0, w, h).data;

      const isUniformCol = (x) => {
        const firstIdx = (0 * w + x) * 4;
        const r0 = data[firstIdx], g0 = data[firstIdx + 1], b0 = data[firstIdx + 2], a0 = data[firstIdx + 3];
        const step = Math.max(1, Math.floor(h / 50));
        for (let y = step; y < h; y += step) {
          const idx = (y * w + x) * 4;
          if (Math.abs(data[idx] - r0) > 10 || Math.abs(data[idx + 1] - g0) > 10 ||
              Math.abs(data[idx + 2] - b0) > 10 || Math.abs(data[idx + 3] - a0) > 30) {
            return false;
          }
        }
        return true;
      };

      const isUniformRow = (y) => {
        const firstIdx = (y * w + 0) * 4;
        const r0 = data[firstIdx], g0 = data[firstIdx + 1], b0 = data[firstIdx + 2], a0 = data[firstIdx + 3];
        const step = Math.max(1, Math.floor(w / 50));
        for (let x = step; x < w; x += step) {
          const idx = (y * w + x) * 4;
          if (Math.abs(data[idx] - r0) > 10 || Math.abs(data[idx + 1] - g0) > 10 ||
              Math.abs(data[idx + 2] - b0) > 10 || Math.abs(data[idx + 3] - a0) > 30) {
            return false;
          }
        }
        return true;
      };

      const vertSeps = [];
      for (let x = 1; x < w - 1; x++) {
        if (isUniformCol(x)) vertSeps.push(x);
      }

      const horizSeps = [];
      for (let y = 1; y < h - 1; y++) {
        if (isUniformRow(y)) horizSeps.push(y);
      }

      const groupSeps = (seps, totalSize) => {
        if (seps.length === 0) return [];
        const boundaries = [];
        let groupStart = seps[0];
        let groupEnd = seps[0];
        for (let i = 1; i < seps.length; i++) {
          if (seps[i] - groupEnd <= 2) {
            groupEnd = seps[i];
          } else {
            boundaries.push(Math.floor((groupStart + groupEnd) / 2));
            groupStart = seps[i];
            groupEnd = seps[i];
          }
        }
        boundaries.push(Math.floor((groupStart + groupEnd) / 2));
        return boundaries.filter(b => b > totalSize * 0.05 && b < totalSize * 0.95);
      };

      const vBounds = groupSeps(vertSeps, w);
      const hBounds = groupSeps(horizSeps, h);

      const isEvenlySpaced = (bounds, total) => {
        if (bounds.length < 1) return false;
        const intervals = [bounds[0], ...bounds.slice(1).map((b, i) => b - bounds[i]), total - bounds[bounds.length - 1]];
        const avg = total / (bounds.length + 1);
        return intervals.every(iv => Math.abs(iv - avg) / avg < 0.15);
      };

      resolve({
        verticalBoundaries: vBounds,
        horizontalBoundaries: hBounds,
        suggestedCols: isEvenlySpaced(vBounds, w) ? vBounds.length + 1 : null,
        suggestedRows: isEvenlySpaced(hBounds, h) ? hBounds.length + 1 : null,
        width: w,
        height: h,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ verticalBoundaries: [], horizontalBoundaries: [], suggestedCols: null, suggestedRows: null, width: 0, height: 0 });
    };
    img.src = url;
  });
}

export async function extractColorPalette(imageBlob, maxColors = 8) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 100 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.floor(img.naturalWidth * scale);
      canvas.height = Math.floor(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorMap = {};
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 50) continue;
        const r = Math.round(data[i] / 16) * 16;
        const g = Math.round(data[i + 1] / 16) * 16;
        const b = Math.round(data[i + 2] / 16) * 16;
        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, maxColors);
      const palette = sorted.map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return { r, g, b, hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`, count };
      });
      resolve(palette);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };
    img.src = url;
  });
}

export async function extractGifFrames(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((singleBlob) => {
        URL.revokeObjectURL(url);
        resolve({
          frames: [{ blob: singleBlob, width: w, height: h }],
          width: w,
          height: h,
          isSingleFrame: true,
        });
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ frames: [], width: 0, height: 0, isSingleFrame: true });
    };
    img.src = url;
  });
}

export async function assembleFramesIntoSheet(frameBlobUrls, frameWidth, frameHeight) {
  const images = await Promise.all(frameBlobUrls.map(url => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  })));

  const validImages = images.filter(Boolean);
  if (validImages.length === 0) return null;

  const fw = frameWidth || validImages[0].naturalWidth;
  const fh = frameHeight || validImages[0].naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = fw * validImages.length;
  canvas.height = fh;
  const ctx = canvas.getContext('2d');

  validImages.forEach((img, i) => {
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, i * fw, 0, fw, fh);
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, width: canvas.width, height: canvas.height, frames: validImages.length, frameWidth: fw, frameHeight: fh });
      } else {
        resolve(null);
      }
    }, 'image/png');
  });
}

export async function removeBackground(imageBlob, tolerance = 30) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 },
      ];

      const colorCounts = {};
      corners.forEach(({ x, y }) => {
        const idx = (y * canvas.width + x) * 4;
        const key = `${data[idx]},${data[idx + 1]},${data[idx + 2]}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      });

      let bgColor = null;
      let maxCount = 0;
      for (const [key, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          bgColor = key.split(',').map(Number);
        }
      }

      if (!bgColor || maxCount < 2) {
        canvas.toBlob((blob) => resolve({ blob, url: URL.createObjectURL(blob), changed: false }), 'image/png');
        return;
      }

      const [bgR, bgG, bgB] = bgColor;
      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i] - bgR);
        const dg = Math.abs(data[i + 1] - bgG);
        const db = Math.abs(data[i + 2] - bgB);
        if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        const newUrl = URL.createObjectURL(blob);
        resolve({ blob, url: newUrl, changed: true });
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: imageBlob, url: URL.createObjectURL(imageBlob), changed: false });
    };
    img.src = url;
  });
}

export async function normalizeFrameSize(imageBlob, targetWidth, targetHeight) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        resolve({ blob, url: URL.createObjectURL(blob), width: targetWidth, height: targetHeight });
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: imageBlob, url: URL.createObjectURL(imageBlob), width: 0, height: 0 });
    };
    img.src = url;
  });
}

export async function detectDuplicateFrames(sheetBlob, frameWidth, frameHeight, totalFrames, threshold = 5, layoutType = 'horizontal_strip', gridCols = null) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(sheetBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);

      const cols = gridCols || totalFrames;
      const frameDataList = [];
      for (let i = 0; i < totalFrames; i++) {
        ctx.clearRect(0, 0, frameWidth, frameHeight);
        let sx, sy;
        if (layoutType === 'vertical_strip') {
          sx = 0;
          sy = i * frameHeight;
        } else if (layoutType === 'grid') {
          sx = (i % cols) * frameWidth;
          sy = Math.floor(i / cols) * frameHeight;
        } else {
          sx = i * frameWidth;
          sy = 0;
        }
        ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
        const data = ctx.getImageData(0, 0, frameWidth, frameHeight).data;
        frameDataList.push(data);
      }

      const duplicates = [];
      for (let i = 0; i < frameDataList.length; i++) {
        for (let j = i + 1; j < frameDataList.length; j++) {
          let diff = 0;
          const len = frameDataList[i].length;
          const sampleStep = Math.max(1, Math.floor(len / 4000));
          let samples = 0;
          for (let k = 0; k < len; k += sampleStep * 4) {
            diff += Math.abs(frameDataList[i][k] - frameDataList[j][k]);
            diff += Math.abs(frameDataList[i][k + 1] - frameDataList[j][k + 1]);
            diff += Math.abs(frameDataList[i][k + 2] - frameDataList[j][k + 2]);
            samples++;
          }
          const avgDiff = diff / (samples * 3);
          if (avgDiff < threshold) {
            duplicates.push({ frameA: i, frameB: j, avgDiff: Math.round(avgDiff * 100) / 100 });
          }
        }
      }

      resolve(duplicates);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };
    img.src = url;
  });
}

export function suggestAnimationSpeed(animType) {
  const speeds = {
    idle: 200,
    walk: 120,
    run: 80,
    attack1: 80,
    attack2: 90,
    attack3: 70,
    hurt: 100,
    death: 150,
    block: 130,
    jump: 100,
    fall: 110,
    cast: 140,
    spawn: 120,
    special: 90,
  };
  const lower = (animType || '').toLowerCase();
  for (const [key, speed] of Object.entries(speeds)) {
    if (lower.includes(key)) return speed;
  }
  return 120;
}

export async function sliceSheetToFrames(imageBlob, cols, rows) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.onload = () => {
      const fw = Math.floor(img.naturalWidth / cols);
      const fh = Math.floor(img.naturalHeight / rows);
      URL.revokeObjectURL(url);
      const frames = [];
      let pending = cols * rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = fw;
          canvas.height = fh;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, c * fw, r * fh, fw, fh, 0, 0, fw, fh);
          const idx = r * cols + c;
          canvas.toBlob((blob) => {
            frames[idx] = { blob, url: URL.createObjectURL(blob), col: c, row: r, width: fw, height: fh };
            pending--;
            if (pending === 0) resolve(frames.filter(Boolean));
          }, 'image/png');
        }
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };
    img.src = url;
  });
}
