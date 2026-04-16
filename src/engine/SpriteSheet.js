import { Texture, Rectangle } from 'pixi.js';

export function extractFrames(baseTexture, frameWidth, frameHeight, options = {}) {
  const { cols, rows, startCol = 0, startRow = 0, count } = options;
  const texWidth = baseTexture.width;
  const texHeight = baseTexture.height;
  const totalCols = cols || Math.floor(texWidth / frameWidth);
  const totalRows = rows || Math.floor(texHeight / frameHeight);
  const frames = [];
  let extracted = 0;
  for (let r = startRow; r < totalRows; r++) {
    for (let c = startCol; c < totalCols; c++) {
      if (count && extracted >= count) break;
      const rect = new Rectangle(c * frameWidth, r * frameHeight, frameWidth, frameHeight);
      frames.push(new Texture({ source: baseTexture.source, frame: rect }));
      extracted++;
    }
    if (count && extracted >= count) break;
  }
  return frames;
}

export function extractRow(baseTexture, frameWidth, frameHeight, row, startCol = 0, numFrames) {
  const totalCols = numFrames || Math.floor(baseTexture.width / frameWidth) - startCol;
  const frames = [];
  for (let c = startCol; c < startCol + totalCols; c++) {
    const rect = new Rectangle(c * frameWidth, row * frameHeight, frameWidth, frameHeight);
    frames.push(new Texture({ source: baseTexture.source, frame: rect }));
  }
  return frames;
}

export function extractGrid(baseTexture, frameWidth, frameHeight) {
  const totalCols = Math.floor(baseTexture.width / frameWidth);
  const totalRows = Math.floor(baseTexture.height / frameHeight);
  const grid = [];
  for (let r = 0; r < totalRows; r++) {
    const row = [];
    for (let c = 0; c < totalCols; c++) {
      const rect = new Rectangle(c * frameWidth, r * frameHeight, frameWidth, frameHeight);
      row.push(new Texture({ source: baseTexture.source, frame: rect }));
    }
    grid.push(row);
  }
  return grid;
}
