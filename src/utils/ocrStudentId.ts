export const STUDENT_ID_LENGTH = 8;

const STUDENT_ID_REGEX = new RegExp(`^\\d{${STUDENT_ID_LENGTH}}$`);
const STUDENT_ID_FIND_REGEX = new RegExp(`\\b\\d{${STUDENT_ID_LENGTH}}\\b`, "g");

export function validateStudentId(id: string): boolean {
  return STUDENT_ID_REGEX.test(id.trim());
}

export function extractStudentId(text: string): string | null {
  const raw = String(text ?? "");

  // Prefer word-boundary matches first.
  const boundaryMatches = raw.match(STUDENT_ID_FIND_REGEX);
  if (boundaryMatches && boundaryMatches.length > 0) {
    return boundaryMatches[0];
  }

  // Fallback: remove whitespace and search for any contiguous digit run.
  const compact = raw.replace(/\s+/g, "");
  const compactMatch = compact.match(new RegExp(`\\d{${STUDENT_ID_LENGTH}}`));
  return compactMatch ? compactMatch[0] : null;
}

export function extractBestDigitsCandidate(text: string): string | null {
  const raw = String(text ?? "");
  const matches = raw.match(/\d{4,}/g);
  if (!matches || matches.length === 0) return null;

  // Prefer the longest run of digits.
  matches.sort((a, b) => b.length - a.length);
  return matches[0] || null;
}

export type ImageQuality = {
  avgLuminance: number;
  laplacianVariance: number;
  tooDark: boolean;
  tooBlurry: boolean;
};

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, n));
}

export function analyzeImageQuality(imageData: ImageData): ImageQuality {
  const data = imageData.data;
  const pixelCount = imageData.width * imageData.height;
  if (pixelCount <= 0) {
    return {
      avgLuminance: 0,
      laplacianVariance: 0,
      tooDark: true,
      tooBlurry: true,
    };
  }

  // Compute avg luminance.
  let sumLum = 0;
  const gray = new Float32Array(pixelCount);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sumLum += lum;
    gray[p] = lum;
  }

  const avgLuminance = sumLum / pixelCount;

  // Approx blur measure: variance of Laplacian (4-neighborhood).
  // Higher variance => sharper.
  const w = imageData.width;
  const h = imageData.height;

  let sum = 0;
  let sumSq = 0;
  let n = 0;

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const idx = y * w + x;
      const center = gray[idx];
      const lap =
        -4 * center +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - w] +
        gray[idx + w];
      sum += lap;
      sumSq += lap * lap;
      n += 1;
    }
  }

  const mean = n ? sum / n : 0;
  const variance = n ? Math.max(0, sumSq / n - mean * mean) : 0;

  // Tuned for typical webcam/mobile frames.
  const tooDark = avgLuminance < 55;
  const tooBlurry = variance < 120;

  return {
    avgLuminance,
    laplacianVariance: variance,
    tooDark,
    tooBlurry,
  };
}

export function preprocessCanvasForNumericOcr(
  source: HTMLCanvasElement,
  opts?: { upscaleToMinWidth?: number; maxWidth?: number },
): HTMLCanvasElement {
  const upscaleToMinWidth = opts?.upscaleToMinWidth ?? 900;
  const maxWidth = opts?.maxWidth ?? 1600;

  const sw = source.width;
  const sh = source.height;

  const scale = Math.min(
    maxWidth / Math.max(1, sw),
    sw < upscaleToMinWidth ? upscaleToMinWidth / Math.max(1, sw) : 1,
  );

  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const out = document.createElement("canvas");
  out.width = dw;
  out.height = dh;

  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) return out;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, dw, dh);

  const imageData = ctx.getImageData(0, 0, dw, dh);
  const data = imageData.data;

  // 1) Grayscale + contrast boost.
  // Contrast formula: (x - 128) * c + 128.
  const contrast = 1.35;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    lum = (lum - 128) * contrast + 128;

    const v = clampByte(lum);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }

  // 2) Mild sharpening (3x3 kernel on grayscale).
  const sharpened = new Uint8ClampedArray(data.length);
  sharpened.set(data);

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  const idxAt = (x: number, y: number) => (y * dw + x) * 4;

  for (let y = 1; y < dh - 1; y += 1) {
    for (let x = 1; x < dw - 1; x += 1) {
      let acc = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const idx = idxAt(x + kx, y + ky);
          const v = data[idx];
          acc += v * kernel[k];
          k += 1;
        }
      }
      const outIdx = idxAt(x, y);
      const v = clampByte(acc);
      sharpened[outIdx] = v;
      sharpened[outIdx + 1] = v;
      sharpened[outIdx + 2] = v;
      // Preserve alpha.
      sharpened[outIdx + 3] = data[outIdx + 3];
    }
  }

  imageData.data.set(sharpened);
  ctx.putImageData(imageData, 0, 0);

  return out;
}
