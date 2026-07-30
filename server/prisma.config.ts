import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prefer process.env so `prisma generate` works in Docker/CI without a live DATABASE_URL.
 * Runtime still requires a real DATABASE_URL (validated in src/config/env.ts).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://build:build@127.0.0.1:5432/build',
  },
});
