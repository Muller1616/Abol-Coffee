import type { JwtPayload } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      owner?: JwtPayload;
    }
  }
}

export {};
