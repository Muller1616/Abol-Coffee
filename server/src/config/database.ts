import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

function createPool(): pg.Pool {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    // Neon pooler-friendly defaults — keep a warm connection ready.
    max: env.NODE_ENV === 'production' ? 10 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: false,
  });
}

function createPrismaClient(pool: pg.Pool): PrismaClient {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const pgPool = globalForPrisma.pgPool ?? createPool();
export const prisma = globalForPrisma.prisma ?? createPrismaClient(pgPool);

if (env.NODE_ENV !== 'production') {
  globalForPrisma.pgPool = pgPool;
  globalForPrisma.prisma = prisma;
}
