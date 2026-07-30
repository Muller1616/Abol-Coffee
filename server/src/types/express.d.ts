import type { JwtPayload } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      owner?: JwtPayload;
      restaurant?: {
        id: string;
        slug: string;
        publicMenuToken: string;
        ownerId: string;
        name: string;
      };
      validatedQuery?: unknown;
      validatedBody?: unknown;
      validatedParams?: unknown;
    }
  }
}

export {};
