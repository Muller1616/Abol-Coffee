import type { NextFunction, Request, Response } from 'express';
import { qrConfig } from '../config/qr.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { logAdminActivity } from '../services/activity.service.js';
import {
  generateQrPngBuffer,
  generateQrSvg,
  getPermanentMenuUrl,
  getQrPreview,
} from '../services/qr.service.js';

export async function getQrPreviewHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const preview = await getQrPreview();

    res.status(200).json({
      success: true,
      message: 'QR code retrieved',
      data: {
        menuUrl: preview.menuUrl,
        pngDataUrl: preview.pngDataUrl,
        svg: preview.svg,
        note: 'This QR code always points to the permanent public menu URL. Menu content changes do not require a new QR code.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadQrPngHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const png = await generateQrPngBuffer();

    await logAdminActivity({
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
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const svg = await generateQrSvg();

    await logAdminActivity({
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
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      message: 'Permanent menu URL retrieved',
      data: {
        menuUrl: getPermanentMenuUrl(),
      },
    });
  } catch (error) {
    next(error);
  }
}
