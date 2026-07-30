import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { qrConfig } from '../config/qr.js';
import { MemoryCache } from '../utils/memoryCache.js';

export type QrPreview = {
  menuUrl: string;
  pngDataUrl: string;
};

type QrAssets = {
  menuUrl: string;
  pngDataUrl: string;
  svg: string;
  pngBuffer: Buffer;
};

/** QR only changes when PUBLIC_MENU_URL changes — cache aggressively. */
const qrCache = new MemoryCache<QrAssets>(60 * 60 * 1000);

function cacheKey(menuUrl: string): string {
  return createHash('sha1').update(menuUrl).digest('hex');
}

export function getPermanentMenuUrl(): string {
  return env.PUBLIC_MENU_URL;
}

async function getOrCreateQrAssets(): Promise<QrAssets> {
  const menuUrl = getPermanentMenuUrl();
  const key = cacheKey(menuUrl);
  const cached = qrCache.get(key);
  if (cached) return cached;

  const [pngDataUrl, svg, pngBuffer] = await Promise.all([
    QRCode.toDataURL(menuUrl, {
      errorCorrectionLevel: qrConfig.errorCorrectionLevel,
      margin: qrConfig.margin,
      width: qrConfig.size,
      type: 'image/png',
    }),
    QRCode.toString(menuUrl, {
      type: 'svg',
      errorCorrectionLevel: qrConfig.errorCorrectionLevel,
      margin: qrConfig.margin,
      width: qrConfig.size,
    }),
    QRCode.toBuffer(menuUrl, {
      type: 'png',
      errorCorrectionLevel: qrConfig.errorCorrectionLevel,
      margin: qrConfig.margin,
      width: qrConfig.size,
    }),
  ]);

  const assets: QrAssets = { menuUrl, pngDataUrl, svg, pngBuffer };
  qrCache.set(key, assets);
  return assets;
}

export async function getQrPreview(): Promise<QrPreview> {
  const assets = await getOrCreateQrAssets();
  return {
    menuUrl: assets.menuUrl,
    pngDataUrl: assets.pngDataUrl,
  };
}

export async function generateQrPngBuffer(): Promise<Buffer> {
  const assets = await getOrCreateQrAssets();
  return assets.pngBuffer;
}

export async function generateQrSvg(): Promise<string> {
  const assets = await getOrCreateQrAssets();
  return assets.svg;
}
