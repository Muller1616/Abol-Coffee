import 'dotenv/config';
import { createApp } from '../src/app.js';
import { createDefaultOpeningHours } from '../src/types/openingHours.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    restaurant?: {
      name: string;
      status: string;
      phone: string | null;
      openingHours: Record<string, unknown>;
    };
  };
};

class CookieJar {
  private cookies = new Map<string, string>();

  get header(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  absorb(setCookieHeaders: string[]): void {
    for (const header of setCookieHeaders) {
      const [pair] = header.split(';');
      if (!pair) continue;

      const separatorIndex = pair.indexOf('=');
      if (separatorIndex === -1) continue;

      const name = pair.slice(0, separatorIndex);
      const value = pair.slice(separatorIndex + 1);
      const expired = /Max-Age=0/i.test(header) || /Expires=Thu, 01 Jan 1970/i.test(header);

      if (expired || value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function api(
  port: number,
  jar: CookieJar,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: JsonBody }> {
  const headers = new Headers(init.headers);
  const cookieHeader = jar.header;

  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    ...init,
    headers,
  });

  jar.absorb(response.headers.getSetCookie());
  const body = (await response.json()) as JsonBody;
  return { status: response.status, body };
}

async function login(port: number, jar: CookieJar): Promise<void> {
  await api(port, jar, '/api/auth/csrf');

  const email = (process.env.OWNER_EMAIL ?? 'owner@abolcoffee.com').toLowerCase();
  const password = process.env.OWNER_PASSWORD ?? 'ChangeMe123!';

  const result = await api(port, jar, '/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': jar.get('csrf_token') ?? '',
    },
    body: JSON.stringify({ email, password, rememberMe: false }),
  });

  assert(result.status === 200, `Login failed (${result.status}): ${result.body.message}`);
  assert(Boolean(jar.get('access_token')), 'Missing access token cookie');
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  assert(address && typeof address === 'object', 'Failed to bind test server');

  const port = address.port;
  const jar = new CookieJar();

  try {
    const unauthorized = await api(port, jar, '/api/admin/restaurant');
    assert(unauthorized.status === 401, `Expected 401, got ${unauthorized.status}`);

    await login(port, jar);

    const current = await api(port, jar, '/api/admin/restaurant');
    assert(current.status === 200, `Get restaurant failed (${current.status})`);
    assert(typeof current.body.data?.restaurant?.name === 'string', 'Restaurant name missing');

    const openingHours = createDefaultOpeningHours();
    openingHours.sunday = { isClosed: false, open: '09:00', close: '17:00' };

    const updated = await api(port, jar, '/api/admin/restaurant', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        name: 'Abol Coffee House',
        phone: '+251911000000',
        description: 'Specialty Ethiopian coffee.',
        facebook: 'https://facebook.com/abolcoffee',
        openingHours,
      }),
    });
    assert(updated.status === 200, `Update failed (${updated.status}): ${updated.body.message}`);
    assert(updated.body.data?.restaurant?.name === 'Abol Coffee House', 'Name was not updated');
    assert(updated.body.data?.restaurant?.phone === '+251911000000', 'Phone was not updated');

    const maintenance = await api(port, jar, '/api/admin/restaurant/status', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ status: 'MAINTENANCE' }),
    });
    assert(
      maintenance.status === 200,
      `Status update failed (${maintenance.status}): ${maintenance.body.message}`,
    );
    assert(maintenance.body.data?.restaurant?.status === 'MAINTENANCE', 'Status not MAINTENANCE');

    const restore = await api(port, jar, '/api/admin/restaurant/status', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(restore.status === 200, `Status restore failed (${restore.status})`);
    assert(restore.body.data?.restaurant?.status === 'ACTIVE', 'Status not restored');

    const invalidHours = await api(port, jar, '/api/admin/restaurant', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        openingHours: {
          ...openingHours,
          monday: { isClosed: false, open: '22:00', close: '08:00' },
        },
      }),
    });
    assert(invalidHours.status === 400, `Expected 400 for invalid hours, got ${invalidHours.status}`);

    console.log('RESTAURANT_VERIFICATION_PASSED');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

main().catch((error: unknown) => {
  console.error('RESTAURANT_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
