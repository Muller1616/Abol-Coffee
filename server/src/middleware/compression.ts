import { constants, gzipSync } from 'node:zlib';
import type { NextFunction, Request, Response } from 'express';

const MIN_SIZE = 1024;

function acceptsGzip(req: Request): boolean {
  const accept = req.headers['accept-encoding'];
  if (!accept || typeof accept !== 'string') return false;
  return accept
    .split(',')
    .some((part) => part.trim().toLowerCase().startsWith('gzip'));
}

/**
 * Lightweight gzip for JSON/text API responses using Node's built-in zlib.
 * Skips tiny payloads and responses that already set Content-Encoding.
 */
export function gzipCompression(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'HEAD' || !acceptsGzip(req)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const compressBody = (body: Buffer, contentType?: string) => {
    if (res.headersSent || res.getHeader('Content-Encoding') || body.length < MIN_SIZE) {
      return null;
    }
    try {
      const compressed = gzipSync(body, { level: constants.Z_DEFAULT_COMPRESSION });
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.removeHeader('Content-Length');
      if (contentType && !res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', contentType);
      }
      return compressed;
    } catch {
      return null;
    }
  };

  res.json = ((payload: unknown) => {
    const body = Buffer.from(JSON.stringify(payload));
    const compressed = compressBody(body, 'application/json; charset=utf-8');
    if (compressed) return originalSend(compressed);
    return originalJson(payload);
  }) as typeof res.json;

  res.send = ((payload: unknown) => {
    let body: Buffer;
    if (Buffer.isBuffer(payload)) {
      body = payload;
    } else if (typeof payload === 'string') {
      body = Buffer.from(payload);
    } else if (payload == null) {
      return originalSend(payload as never);
    } else {
      return originalSend(payload as never);
    }

    const compressed = compressBody(body);
    if (compressed) return originalSend(compressed);
    return originalSend(body);
  }) as typeof res.send;

  next();
}
