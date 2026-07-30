import type { NextFunction, Request, Response } from 'express';
import { qrConfig } from '../config/qr.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { queueAdminActivity } from '../services/activity.service.js';
import {
  generateQrPngBuffer,
  generateQrSvg,
  getPermanentMenuUrlForOwner,
  getQrPreview,
  rotatePublicMenuToken,
} from '../services/qr.service.js';
import { getPublicAppOrigin } from '../services/restaurantIdentity.service.js';

function requireOwnerId(req: Request): string {
  if (!req.owner?.sub) {
    throw new Error('Authentication required');
  }
  return req.owner.sub;
}

export async function getQrPreviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const preview = await getQrPreview(requireOwnerId(req));
    const origin = getPublicAppOrigin();
    const isLocal =
      /localhost|127\.0\.0\.1|::1/i.test(origin) || origin.startsWith('http://');

    res.status(200).json({
      success: true,
      message: 'QR code retrieved',
      data: {
        menuUrl: preview.menuUrl,
        pngDataUrl: preview.pngDataUrl,
        publicMenuToken: preview.publicMenuToken,
        restaurantSlug: preview.restaurantSlug,
        isLocalhostUrl: isLocal,
        note: isLocal
          ? 'WARNING: This QR currently points at a local/dev origin. Do not print it for restaurant tables until CLIENT_URL / PUBLIC_MENU_URL use your permanent production HTTPS domain.'
          : 'This QR code always points to the permanent public menu URL. Menu content changes do not require a new QR code. Only regenerate the public menu token if you intentionally want to invalidate old prints.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadQrPngHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const png = await generateQrPngBuffer(requireOwnerId(req));

    queueAdminActivity({
      action: AdminAction.DOWNLOAD,
      entity: AdminEntity.QR,
      summary: 'Downloaded QR code (PNG)',
      type: 'QR_DOWNLOADED',
      title: 'QR code downloaded',
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${qrConfig.fileBasename}.png"`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(png);
  } catch (error) {
    next(error);
  }
}

export async function downloadQrSvgHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const svg = await generateQrSvg(requireOwnerId(req));

    queueAdminActivity({
      action: AdminAction.DOWNLOAD,
      entity: AdminEntity.QR,
      summary: 'Downloaded QR code (SVG)',
      type: 'QR_DOWNLOADED',
      title: 'QR code downloaded',
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${qrConfig.fileBasename}.svg"`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(svg);
  } catch (error) {
    next(error);
  }
}

export async function getQrUrlHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      message: 'Permanent menu URL retrieved',
      data: {
        menuUrl: await getPermanentMenuUrlForOwner(requireOwnerId(req)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function regeneratePublicMenuTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await rotatePublicMenuToken(requireOwnerId(req));

    queueAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.QR,
      entityId: req.restaurant?.id,
      summary: 'Regenerated public menu token (previous printed QR codes are invalidated)',
      type: 'QR_TOKEN_REGENERATED',
      title: 'Public menu link rotated',
    });

    res.status(200).json({
      success: true,
      message: 'Public menu token regenerated. Download and reprint your QR code.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
