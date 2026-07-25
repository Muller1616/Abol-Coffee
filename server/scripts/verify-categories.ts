import 'dotenv/config';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    category?: { id: string; name: string; isActive: boolean; displayOrder: number };
    categories?: Array<{ id: string; name: string; displayOrder: number; isActive: boolean }>;
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

  const result = await api(port, jar, '/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': jar.get('csrf_token') ?? '',
    },
    body: JSON.stringify({
      email: (process.env.OWNER_EMAIL ?? 'owner@abolcoffee.com').toLowerCase(),
      password: process.env.OWNER_PASSWORD ?? 'ChangeMe123!',
      rememberMe: false,
    }),
  });

  assert(result.status === 200, `Login failed (${result.status}): ${result.body.message}`);
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  assert(address && typeof address === 'object', 'Failed to bind test server');

  const port = address.port;
  const jar = new CookieJar();
  const suffix = Date.now().toString(36);

  try {
    const unauthorized = await api(port, jar, '/api/admin/categories');
    assert(unauthorized.status === 401, `Expected 401, got ${unauthorized.status}`);

    await login(port, jar);

    const created = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        name: `Coffee ${suffix}`,
        displayOrder: 1,
        isActive: true,
      }),
    });
    assert(created.status === 201, `Create failed (${created.status}): ${created.body.message}`);
    const categoryId = created.body.data?.category?.id;
    assert(typeof categoryId === 'string', 'Created category id missing');

    const duplicate = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Coffee ${suffix}` }),
    });
    assert(duplicate.status === 409, `Expected 409 for duplicate, got ${duplicate.status}`);

    const second = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        name: `Tea ${suffix}`,
        displayOrder: 2,
      }),
    });
    assert(second.status === 201, `Second create failed (${second.status})`);
    const secondId = second.body.data?.category?.id;
    assert(typeof secondId === 'string', 'Second category id missing');

    const disabled = await api(port, jar, `/api/admin/categories/${categoryId}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert(disabled.status === 200, `Disable failed (${disabled.status})`);
    assert(disabled.body.data?.category?.isActive === false, 'Category still active');

    const reordered = await api(port, jar, '/api/admin/categories/reorder', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        items: [
          { id: secondId, displayOrder: 0 },
          { id: categoryId, displayOrder: 1 },
        ],
      }),
    });
    assert(reordered.status === 200, `Reorder failed (${reordered.status})`);

    const listed = await api(port, jar, '/api/admin/categories');
    assert(listed.status === 200, `List failed (${listed.status})`);
    const names = (listed.body.data?.categories ?? []).map((item) => item.name);
    assert(names.includes(`Coffee ${suffix}`), 'Created coffee category missing from list');
    assert(names.includes(`Tea ${suffix}`), 'Created tea category missing from list');

    await prisma.menuItem.create({
      data: {
        categoryId,
        name: `Temp Item ${suffix}`,
        description: 'Temporary item for delete rule check',
        price: 10,
        currency: 'ETB',
        isAvailable: true,
        displayOrder: 0,
      },
    });

    const blockedDelete = await api(port, jar, `/api/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
    });
    assert(
      blockedDelete.status === 400,
      `Expected 400 when deleting non-empty category, got ${blockedDelete.status}`,
    );

    await prisma.menuItem.deleteMany({ where: { categoryId } });

    const deleted = await api(port, jar, `/api/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
    });
    assert(deleted.status === 200, `Delete failed (${deleted.status})`);

    await api(port, jar, `/api/admin/categories/${secondId}`, {
      method: 'DELETE',
      headers: {
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
    });

    console.log('CATEGORY_VERIFICATION_PASSED');
  } finally {
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

main().catch((error: unknown) => {
  console.error('CATEGORY_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
