import 'dotenv/config';
import { createApp } from '../src/app.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    category?: { id: string };
    item?: { id: string };
    stats?: {
      totalCategories: number;
      totalMenuItems: number;
      availableItems: number;
      hiddenItems: number;
      lastUpdated: string | null;
      restaurantStatus: string;
    };
    restaurant?: { name: string };
    recentUpdates?: Array<{ summary: string }>;
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
      if (expired || value === '') this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function api(
  port: number,
  jar: CookieJar,
  route: string,
  init: RequestInit = {},
): Promise<{ status: number; body: JsonBody }> {
  const headers = new Headers(init.headers);
  if (jar.header) headers.set('cookie', jar.header);
  const response = await fetch(`http://127.0.0.1:${port}${route}`, { ...init, headers });
  jar.absorb(response.headers.getSetCookie());
  return { status: response.status, body: (await response.json()) as JsonBody };
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
    const unauthorized = await api(port, jar, '/api/admin/dashboard');
    assert(unauthorized.status === 401, `Expected 401, got ${unauthorized.status}`);

    await api(port, jar, '/api/auth/csrf');
    const login = await api(port, jar, '/api/auth/login', {
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
    assert(login.status === 200, `Login failed (${login.status})`);

    const category = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Dash Cat ${suffix}` }),
    });
    const categoryId = category.body.data?.category?.id;
    assert(typeof categoryId === 'string', 'Category id missing');

    const available = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId,
        name: `Dash Available ${suffix}`,
        price: 50,
        isAvailable: true,
      }),
    });
    const availableId = available.body.data?.item?.id;
    assert(typeof availableId === 'string', 'Available item missing');

    const hidden = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId,
        name: `Dash Hidden ${suffix}`,
        price: 60,
        isAvailable: false,
      }),
    });
    const hiddenId = hidden.body.data?.item?.id;
    assert(typeof hiddenId === 'string', 'Hidden item missing');

    const dashboard = await api(port, jar, '/api/admin/dashboard?recentLimit=5');
    assert(dashboard.status === 200, `Dashboard failed (${dashboard.status})`);
    assert(typeof dashboard.body.data?.stats?.totalCategories === 'number', 'Missing stats');
    assert(dashboard.body.data.stats.totalCategories >= 1, 'totalCategories too low');
    assert(dashboard.body.data.stats.totalMenuItems >= 2, 'totalMenuItems too low');
    assert(dashboard.body.data.stats.availableItems >= 1, 'availableItems too low');
    assert(dashboard.body.data.stats.hiddenItems >= 1, 'hiddenItems too low');
    assert(typeof dashboard.body.data.stats.lastUpdated === 'string', 'lastUpdated missing');
    assert(
      dashboard.body.data.stats.restaurantStatus === 'ACTIVE' ||
        dashboard.body.data.stats.restaurantStatus === 'MAINTENANCE',
      'Invalid restaurant status',
    );
    assert(typeof dashboard.body.data.restaurant?.name === 'string', 'Restaurant widget missing');
    assert((dashboard.body.data.recentUpdates?.length ?? 0) > 0, 'Recent updates empty');
    assert(
      (dashboard.body.data.recentUpdates ?? []).some((entry) =>
        entry.summary.includes(`Dash Cat ${suffix}`),
      ),
      'Expected category activity in recent updates',
    );

    await api(port, jar, `/api/admin/menu-items/${availableId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/menu-items/${hiddenId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });

    console.log('DASHBOARD_VERIFICATION_PASSED');
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
  console.error('DASHBOARD_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
