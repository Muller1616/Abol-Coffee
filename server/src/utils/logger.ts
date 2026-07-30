import { randomUUID } from 'node:crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const minLevel = resolveMinLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function serializeError(error: unknown): LogContext | undefined {
  if (error === undefined || error === null) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      ...(error.cause !== undefined ? { cause: serializeError(error.cause) } : {}),
    };
  }

  return { value: String(error) };
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(`${line}\n`);
    return;
  }

  process.stdout.write(`${line}\n`);
}

export function createRequestId(): string {
  return randomUUID();
}

export const logger = {
  debug(message: string, context?: LogContext) {
    write('debug', message, context);
  },
  info(message: string, context?: LogContext) {
    write('info', message, context);
  },
  warn(message: string, context?: LogContext) {
    write('warn', message, context);
  },
  error(message: string, context?: LogContext & { error?: unknown }) {
    const { error, ...rest } = context ?? {};
    write('error', message, {
      ...rest,
      ...(error !== undefined ? { error: serializeError(error) } : {}),
    });
  },
};
