import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  PUBLIC_MENU_URL: z.string().url('PUBLIC_MENU_URL must be a valid permanent menu URL'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),
  UPLOADS_DIR: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function isLocalhostUrl(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function isPlaceholderSecret(secret: string): boolean {
  const normalized = secret.toLowerCase();
  return (
    normalized.includes('replace_with') ||
    normalized.includes('changeme') ||
    normalized.includes('your_jwt') ||
    normalized.includes('example')
  );
}

function smtpConfigured(data: Env): boolean {
  return Boolean(
    data.SMTP_HOST &&
      data.SMTP_PORT &&
      data.SMTP_FROM &&
      data.SMTP_USER &&
      data.SMTP_PASS,
  );
}

function cloudinaryConfigured(data: Env): boolean {
  return Boolean(
    data.CLOUDINARY_CLOUD_NAME?.trim() &&
      data.CLOUDINARY_API_KEY?.trim() &&
      data.CLOUDINARY_API_SECRET?.trim(),
  );
}

function assertProductionReady(data: Env): void {
  if (data.NODE_ENV !== 'production') return;

  const failures: string[] = [];

  if (isLocalhostUrl(data.CLIENT_URL)) {
    failures.push(
      'CLIENT_URL cannot be localhost/127.0.0.1 in production (used for CORS and cookie auth).',
    );
  }

  if (isLocalhostUrl(data.PUBLIC_MENU_URL)) {
    failures.push(
      'PUBLIC_MENU_URL cannot be localhost/127.0.0.1 in production (printed on QR codes — must be permanent).',
    );
  }

  try {
    const menuPath = new URL(data.PUBLIC_MENU_URL).pathname.replace(/\/$/, '') || '/';
    if (menuPath !== '/menu' && !menuPath.startsWith('/menu/')) {
      failures.push(
        'PUBLIC_MENU_URL path should be /menu (or /menu/<slug>) so printed QR codes stay stable.',
      );
    }
  } catch {
    failures.push('PUBLIC_MENU_URL must be a valid absolute URL.');
  }

  if (isPlaceholderSecret(data.JWT_SECRET)) {
    failures.push('JWT_SECRET looks like a placeholder. Set a strong random secret (32+ chars).');
  }

  if (!smtpConfigured(data)) {
    failures.push(
      'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM are required in production for password-reset emails.',
    );
  }

  if (!cloudinaryConfigured(data)) {
    failures.push(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required in production so images survive redeploys.',
    );
  }

  if (data.COOKIE_SAME_SITE === 'none' && !data.COOKIE_DOMAIN?.trim()) {
    failures.push(
      'COOKIE_DOMAIN is required when COOKIE_SAME_SITE=none (cross-site SPA ↔ API cookie auth).',
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Missing or invalid production configuration:\n${failures.map((item) => `- ${item}`).join('\n')}\nApplication cannot start.`,
    );
  }
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Missing required environment variable(s):\n${details}\nApplication cannot start.`,
    );
  }

  assertProductionReady(parsed.data);
  return parsed.data;
}

export const env = loadEnv();

export function isSmtpConfigured(): boolean {
  return smtpConfigured(env);
}

export function isCloudinaryEnvConfigured(): boolean {
  return cloudinaryConfigured(env);
}
