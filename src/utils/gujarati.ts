// Utilities to detect Gujarati text, load font, and build ESC/POS raster bytes from a canvas-rendered receipt

export const hasGujarati = (text: string): boolean => /[\u0A80-\u0AFF]/.test(text);

let guFontLoaded = false;
export async function ensureGujaratiFont(): Promise<void> {
  if (guFontLoaded) return;
  if (typeof document === 'undefined' || !(document as any).fonts) return;
  try {
    const font = new FontFace('Noto Sans Gujarati', "url('/assets/fonts/NotoSansGujarati-Regular.ttf') format('truetype')");
    await font.load();
    (document as any).fonts.add(font);
    guFontLoaded = true;
  } catch {
    // ignore font load errors – canvas will fallback to system fonts
  }
}

function canvasToRasterBytes(canvas: HTMLCanvasElement): Uint8Array {
  const GS = 0x1D;
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, width, height);
  const bytesPerRow = Math.ceil(width / 8);
  const rasterData = new Uint8Array(bytesPerRow * height);

  // Simple threshold; canvas anti-aliasing keeps glyphs readable
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = img.data[idx];
      const g = img.data[idx + 1];
      const b = img.data[idx + 2];
      const a = img.data[idx + 3];
      // treat transparent as white
      const lum = a === 0 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
      const isBlack = lum < 170; // slightly higher threshold for bold, clear text
      if (isBlack) {
        const byteIndex = y * bytesPerRow + (x >> 3);
        const bit = 0x80 >> (x & 7); // MSB first
        rasterData[byteIndex] |= bit;
      }
    }
  }

  // GS v 0 m xL xH yL yH + data  (m=0: normal)
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  const out = new Uint8Array(header.length + rasterData.length);
  out.set(header, 0);
  out.set(rasterData, header.length);
  return out;
}

// Safer: split raster into bands with their own headers to avoid printer firmware loops
function canvasToRasterBands(canvas: HTMLCanvasElement, maxRows = 128): Uint8Array[] {
  const GS = 0x1D;
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, width, height);
  const bytesPerRow = Math.ceil(width / 8);

  const bands: Uint8Array[] = [];

  for (let startY = 0; startY < height; startY += maxRows) {
    const bandHeight = Math.min(maxRows, height - startY);
    const rasterData = new Uint8Array(bytesPerRow * bandHeight);

    for (let y = 0; y < bandHeight; y++) {
      const globalY = startY + y;
      for (let x = 0; x < width; x++) {
        const idx = (globalY * width + x) * 4;
        const r = img.data[idx];
        const g = img.data[idx + 1];
        const b = img.data[idx + 2];
        const a = img.data[idx + 3];
        const lum = a === 0 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
        const isBlack = lum < 170;
        if (isBlack) {
          const byteIndex = y * bytesPerRow + (x >> 3);
          const bit = 0x80 >> (x & 7);
          rasterData[byteIndex] |= bit;
        }
      }
    }

    const xL = bytesPerRow & 0xff;
    const xH = (bytesPerRow >> 8) & 0xff;
    const yL = bandHeight & 0xff;
    const yH = (bandHeight >> 8) & 0xff;
    const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    const out = new Uint8Array(header.length + rasterData.length);
    out.set(header, 0);
    out.set(rasterData, header.length);
    bands.push(out);
  }

  return bands;
}

export async function buildReceiptImageBytes(
  lines: string[],
  opts?: { 
    widthPx?: number; 
    fontSize?: number; 
    lineHeight?: number; 
    padding?: number;
    largeLines?: number[]; // indices of lines to render larger
    largeFontSize?: number;
    largeLineHeight?: number;
  }
): Promise<Uint8Array> {
  const widthPx = opts?.widthPx ?? 384; // 58mm = ~384px for 2-inch thermal printer
  const fontSize = opts?.fontSize ?? 18;
  const lineHeight = opts?.lineHeight ?? 24;
  const padding = opts?.padding ?? 8;
  const largeLines = opts?.largeLines ?? [];
  const largeFontSize = opts?.largeFontSize ?? 24; // Larger for company details
  const largeLineHeight = opts?.largeLineHeight ?? 30;

  await ensureGujaratiFont();

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = 10; // temp height for measuring
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Preprocess: wrap long lines to fit printable width
  const hp = 8; // horizontal padding
  const maxWidth = widthPx - hp * 2;
  type Seg = { text: string; isLarge: boolean };
  const segments: Seg[] = [];

  for (let i = 0; i < lines.length; i++) {
    const isLarge = largeLines.includes(i);
    const currentFontSize = isLarge ? largeFontSize : fontSize;
    const currentLineHeight = isLarge ? largeLineHeight : lineHeight;
    ctx.font = `bold ${currentFontSize}px 'Noto Sans Gujarati', 'Courier New', monospace`;

    const chars = Array.from(lines[i] ?? '');
    let buffer = '';
    for (const ch of chars) {
      const test = buffer + ch;
      if (ctx.measureText(test).width <= maxWidth) {
        buffer = test;
      } else {
        if (buffer) segments.push({ text: buffer, isLarge });
        buffer = ch;
      }
    }
    segments.push({ text: buffer, isLarge });
  }

  // Calculate total height from wrapped segments
  let totalHeight = padding * 2;
  for (const seg of segments) {
    totalHeight += seg.isLarge ? largeLineHeight : lineHeight;
  }

  // Resize canvas to final dimensions
  canvas.height = totalHeight;

  // white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw segments centered
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = padding;
  for (const seg of segments) {
    const currentFontSize = seg.isLarge ? largeFontSize : fontSize;
    const currentLineHeight = seg.isLarge ? largeLineHeight : lineHeight;
    ctx.font = `bold ${currentFontSize}px 'Noto Sans Gujarati', 'Courier New', monospace`;

    const metrics = ctx.measureText(seg.text);
    const x = Math.max(hp, (widthPx - metrics.width) / 2);

    ctx.fillText(seg.text, x, y);
    y += currentLineHeight;
  }

  return canvasToRasterBytes(canvas);
}

// Export commands in safe bands to avoid firmware loops
export async function buildReceiptImageCommands(
  lines: string[],
  opts?: {
    widthPx?: number;
    fontSize?: number;
    lineHeight?: number;
    padding?: number;
    largeLines?: number[];
    largeFontSize?: number;
    largeLineHeight?: number;
  }
): Promise<Uint8Array[]> {
  // Reuse layout logic by drawing once then slicing into bands
  const widthPx = opts?.widthPx ?? 384;
  const fontSize = opts?.fontSize ?? 18;
  const lineHeight = opts?.lineHeight ?? 24;
  const padding = opts?.padding ?? 8;
  const largeLines = opts?.largeLines ?? [];
  const largeFontSize = opts?.largeFontSize ?? 24;
  const largeLineHeight = opts?.largeLineHeight ?? 30;

  await ensureGujaratiFont();

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = 10;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const hp = 8;
  const maxWidth = widthPx - hp * 2;
  type Seg = { text: string; isLarge: boolean };
  const segments: Seg[] = [];

  for (let i = 0; i < lines.length; i++) {
    const isLarge = largeLines.includes(i);
    const currentFontSize = isLarge ? largeFontSize : fontSize;
    ctx.font = `bold ${currentFontSize}px 'Noto Sans Gujarati', 'Courier New', monospace`;

    const chars = Array.from(lines[i] ?? '');
    let buffer = '';
    for (const ch of chars) {
      const test = buffer + ch;
      if (ctx.measureText(test).width <= maxWidth) buffer = test; else { if (buffer) segments.push({ text: buffer, isLarge }); buffer = ch; }
    }
    segments.push({ text: buffer, isLarge });
  }

  let totalHeight = padding * 2;
  for (const seg of segments) totalHeight += seg.isLarge ? largeLineHeight : lineHeight;

  canvas.height = totalHeight;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = padding;
  for (const seg of segments) {
    const currentFontSize = seg.isLarge ? largeFontSize : fontSize;
    const currentLineHeight = seg.isLarge ? largeLineHeight : lineHeight;
    ctx.font = `bold ${currentFontSize}px 'Noto Sans Gujarati', 'Courier New', monospace`;
    const metrics = ctx.measureText(seg.text);
    const x = Math.max(hp, (widthPx - metrics.width) / 2);
    ctx.fillText(seg.text, x, y);
    y += currentLineHeight;
  }

  return canvasToRasterBands(canvas, 128);
}

