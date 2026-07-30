import { gzip, constants } from 'node:zlib';
import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';

const gzipAsync = promisify(gzip);
const MIN_SIZE = 1024;

function acceptsGzip(req: Request): boolean {
  const accept = req.headers['accept-encoding'];
  if (!accept || typeof accept !== 'string') return false;
  return accept
    .split(',')
    .some((part) => part.trim().toLowerCase().startsWith('gzip'));
}

/**
 * Async gzip for JSON/text API responses — avoids blocking the event loop
 * on larger public-menu payloads under concurrency.
 */
export function gzipCompression(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'HEAD' || !acceptsGzip(req)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let compressPending = false;

  const finishCompressed = (body: Buffer, contentType?: string) => {
    if (res.headersSent || res.getHeader('Content-Encoding') || body.length < MIN_SIZE) {
      return null;
    }
    return gzipAsync(body, { level: constants.Z_DEFAULT_COMPRESSION })
      .then((compressed) => {
        if (res.headersSent) return;
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.removeHeader('Content-Length');
        if (contentType && !res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', contentType);
        }
        originalSend(compressed);
      })
      .catch(() => {
        if (!res.headersSent) originalSend(body);
      });
  };

  res.json = ((payload: unknown) => {
    const body = Buffer.from(JSON.stringify(payload));
    if (body.length < MIN_SIZE) {
      return originalJson(payload);
    }
    compressPending = true;
    void finishCompressed(body, 'application/json; charset=utf-8')?.finally(() => {
      compressPending = false;
    });
    return res;
  }) as typeof res.json;

  res.send = ((payload: unknown) => {
    if (compressPending) {
      return originalSend(payload as never);
    }

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

    if (body.length < MIN_SIZE) {
      return originalSend(body);
    }

    void finishCompressed(body);
    return res;
  }) as typeof res.send;

  next();
}
