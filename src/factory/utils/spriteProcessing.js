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

export function detectGridLayout(width, height) {
  if (width <= 0 || height <= 0) return { cols: 1, rows: 1, frameWidth: width, frameHeight: height, type: 'single_frame' };

  const commonSizes = [16, 24, 32, 48, 64, 80, 96, 100, 128, 135, 162, 192, 256, 512];

  if (width > height * 1.5) {
    for (const size of commonSizes) {
      if (width % size === 0 && Math.abs(height - size) < size * 0.3) {
        const cols = Math.round(width / size);
        if (cols >= 2 && cols <= 60) {
          return { cols, rows: 1, frameWidth: size, frameHeight: height, type: 'horizontal_strip' };
        }
      }
    }
    if (width % height === 0) {
      const cols = Math.round(width / height);
      if (cols >= 2 && cols <= 60) {
        return { cols, rows: 1, frameWidth: height, frameHeight: height, type: 'horizontal_strip' };
      }
    }
    const guessFrameW = height;
    const guessFrames = Math.round(width / guessFrameW);
    if (guessFrames >= 2 && guessFrames <= 60 && Math.abs(width - guessFrames * guessFrameW) < 4) {
      return { cols: guessFrames, rows: 1, frameWidth: guessFrameW, frameHeight: height, type: 'horizontal_strip' };
    }
  }

  if (height > width * 1.5) {
    for (const size of commonSizes) {
      if (height % size === 0 && Math.abs(width - size) < size * 0.3) {
        const rows = Math.round(height / size);
        if (rows >= 2 && rows <= 60) {
          return { cols: 1, rows, frameWidth: width, frameHeight: size, type: 'vertical_strip' };
        }
      }
    }
    if (height % width === 0) {
      const rows = Math.round(height / width);
      if (rows >= 2 && rows <= 60) {
        return { cols: 1, rows, frameWidth: width, frameHeight: width, type: 'vertical_strip' };
      }
    }
  }

  for (const fw of commonSizes) {
    if (width % fw !== 0) continue;
    const cols = width / fw;
    if (cols < 1 || cols > 60) continue;
    for (const fh of commonSizes) {
      if (height % fh !== 0) continue;
      const rows = height / fh;
      if (rows < 2 || rows > 60) continue;
      if (cols * rows >= 4 && cols * rows <= 200) {
        return { cols, rows, frameWidth: fw, frameHeight: fh, type: 'grid' };
      }
    }
  }

  if (width > height * 0.8 && width < height * 1.2) {
    return { cols: 1, rows: 1, frameWidth: width, frameHeight: height, type: 'single_frame' };
  }

  const ratio = width / height;
  const guessCols = Math.max(1, Math.round(ratio));
  const fw = Math.round(width / guessCols);
  return { cols: guessCols, rows: 1, frameWidth: fw, frameHeight: height, type: guessCols > 1 ? 'horizontal_strip' : 'single_frame' };
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
