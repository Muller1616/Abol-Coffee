import type { NextFunction, Request, Response } from 'express';
import { createRequestId } from '../utils/logger.js';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim().slice(0, 128)
      : createRequestId();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
