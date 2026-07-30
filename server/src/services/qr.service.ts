import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import { qrConfig } from '../config/qr.js';
import { MemoryCache } from '../utils/memoryCache.js';
import {
  buildPublicMenuUrl,
  getRestaurantByOwnerId,
  getRestaurantPublicIdentity,
  regeneratePublicMenuToken,
} from './restaurantIdentity.service.js';

export type QrPreview = {
  menuUrl: string;
  pngDataUrl: string;
  publicMenuToken: string;
  restaurantSlug: string;
};

type QrAssets = {
  menuUrl: string;
  pngDataUrl: string;
  svg: string;
  pngBuffer: Buffer;
  publicMenuToken: string;
  restaurantSlug: string;
};

/** QR only changes when the permanent public menu URL changes — cache aggressively. */
const qrCache = new MemoryCache<QrAssets>(60 * 60 * 1000);

function cacheKey(menuUrl: string): string {
  return createHash('sha1').update(menuUrl).digest('hex');
}

export async function getPermanentMenuUrlForOwner(ownerId: string): Promise<string> {
  const restaurant = await getRestaurantByOwnerId(ownerId);
  return buildPublicMenuUrl(restaurant.publicMenuToken);
}

export async function getPermanentMenuUrl(restaurantId?: string): Promise<string> {
  const restaurant = await getRestaurantPublicIdentity(restaurantId);
  return buildPublicMenuUrl(restaurant.publicMenuToken);
}

async function getOrCreateQrAssets(ownerId: string): Promise<QrAssets> {
  const restaurant = await getRestaurantByOwnerId(ownerId);
  const menuUrl = buildPublicMenuUrl(restaurant.publicMenuToken);
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

  const assets: QrAssets = {
    menuUrl,
    pngDataUrl,
    svg,
    pngBuffer,
    publicMenuToken: restaurant.publicMenuToken,
    restaurantSlug: restaurant.slug,
  };
  qrCache.set(key, assets);
  return assets;
}

export async function getQrPreview(ownerId: string): Promise<QrPreview> {
  const assets = await getOrCreateQrAssets(ownerId);
  return {
    menuUrl: assets.menuUrl,
    pngDataUrl: assets.pngDataUrl,
    publicMenuToken: assets.publicMenuToken,
    restaurantSlug: assets.restaurantSlug,
  };
}

export async function generateQrPngBuffer(ownerId: string): Promise<Buffer> {
  const assets = await getOrCreateQrAssets(ownerId);
  return assets.pngBuffer;
}

export async function generateQrSvg(ownerId: string): Promise<string> {
  const assets = await getOrCreateQrAssets(ownerId);
  return assets.svg;
}

export async function rotatePublicMenuToken(ownerId: string) {
  const restaurant = await getRestaurantByOwnerId(ownerId);
  const previousUrl = buildPublicMenuUrl(restaurant.publicMenuToken);
  qrCache.delete(cacheKey(previousUrl));

  const updated = await regeneratePublicMenuToken(restaurant.id);
  const menuUrl = buildPublicMenuUrl(updated.publicMenuToken);
  return {
    restaurantSlug: updated.slug,
    publicMenuToken: updated.publicMenuToken,
    menuUrl,
  };
}
