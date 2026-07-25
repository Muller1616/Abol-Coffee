import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { qrConfig } from '../config/qr.js';

export type QrPreview = {
  menuUrl: string;
  pngDataUrl: string;
  svg: string;
};

export function getPermanentMenuUrl(): string {
  return env.PUBLIC_MENU_URL;
}

export async function getQrPreview(): Promise<QrPreview> {
  const menuUrl = getPermanentMenuUrl();

  const [pngDataUrl, svg] = await Promise.all([
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
  ]);

  return {
    menuUrl,
    pngDataUrl,
    svg,
  };
}

export async function generateQrPngBuffer(): Promise<Buffer> {
  return QRCode.toBuffer(getPermanentMenuUrl(), {
    type: 'png',
    errorCorrectionLevel: qrConfig.errorCorrectionLevel,
    margin: qrConfig.margin,
    width: qrConfig.size,
  });
}

export async function generateQrSvg(): Promise<string> {
  return QRCode.toString(getPermanentMenuUrl(), {
    type: 'svg',
    errorCorrectionLevel: qrConfig.errorCorrectionLevel,
    margin: qrConfig.margin,
    width: qrConfig.size,
  });
}
