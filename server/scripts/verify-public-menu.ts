import 'dotenv/config';
import { createApp } from '../src/app.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    publicMenuToken?: string;
    status?: 'ACTIVE' | 'MAINTENANCE';
    category?: { id: string };
    item?: { id: string };
    items?: Array<{ id: string; name: string; categoryName?: string; price?: number }>;
    categories?: Array<{ id: string; name: string; items: Array<{ name: string; price?: number }> }>;
    restaurant?: { name: string; status?: string };
    pagination?: { total: number };
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
  jar: CookieJar | null,
  route: string,
  init: RequestInit = {},
): Promise<{ status: number; body: JsonBody; cacheControl: string | null }> {
  const headers = new Headers(init.headers);
  if (jar?.header) headers.set('cookie', jar.header);

  const response = await fetch(`http://127.0.0.1:${port}${route}`, { ...init, headers });
  if (jar) jar.absorb(response.headers.getSetCookie());

  return {
    status: response.status,
    body: (await response.json()) as JsonBody,
    cacheControl: response.headers.get('cache-control'),
  };
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
  assert(result.status === 200, `Login failed (${result.status})`);
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
    await login(port, jar);

    const activeCategory = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Public Coffee ${suffix}`, isActive: true }),
    });
    const activeCategoryId = activeCategory.body.data?.category?.id;
    assert(typeof activeCategoryId === 'string', 'Active category missing');

    const inactiveCategory = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Hidden Cat ${suffix}`, isActive: false }),
    });
    const inactiveCategoryId = inactiveCategory.body.data?.category?.id;
    assert(typeof inactiveCategoryId === 'string', 'Inactive category missing');

    const visibleItem = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: activeCategoryId,
        name: `Cappuccino ${suffix}`,
        description: 'Fresh espresso blended with steamed milk',
        price: 120,
        isAvailable: true,
      }),
    });
    const visibleItemId = visibleItem.body.data?.item?.id;
    assert(typeof visibleItemId === 'string', 'Visible item missing');

    const hiddenItem = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: activeCategoryId,
        name: `Secret Brew ${suffix}`,
        description: 'Hidden drink',
        price: 150,
        isAvailable: false,
      }),
    });
    const hiddenItemId = hiddenItem.body.data?.item?.id;
    assert(typeof hiddenItemId === 'string', 'Hidden item missing');

    await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: inactiveCategoryId,
        name: `Ghost Latte ${suffix}`,
        price: 110,
        isAvailable: true,
      }),
    });

    const entry = await api(port, null, '/api/public/menu/entry');
    assert(entry.status === 200, `Public menu entry failed (${entry.status})`);
    const publicToken = entry.body.data?.publicMenuToken;
    assert(typeof publicToken === 'string' && publicToken.length > 0, 'publicMenuToken missing');

    const missingToken = await api(port, null, '/api/public/menu/not-a-real-token');
    assert(missingToken.status === 404, `Expected 404 for invalid token, got ${missingToken.status}`);

    const menuPath = `/api/public/menu/${publicToken}`;
    const menu = await api(port, null, menuPath);
    assert(menu.status === 200, `Public menu failed (${menu.status})`);
    assert(menu.body.data?.status === 'ACTIVE', 'Expected ACTIVE menu');
    assert(
      menu.cacheControl?.includes('no-cache') ?? false,
      'Expected Cache-Control: private, no-cache for fresh guest menus',
    );

    const flattenItems = (payload: {
      categories?: Array<{ items: Array<{ name: string; price?: number }> }>;
      items?: Array<{ name: string; price?: number }>;
    }) =>
      payload.items ??
      payload.categories?.flatMap((category) => category.items) ??
      [];

    const itemNames = flattenItems(menu.body.data ?? {}).map((item) => item.name);
    assert(itemNames.includes(`Cappuccino ${suffix}`), 'Visible item missing from public menu');
    assert(!itemNames.includes(`Secret Brew ${suffix}`), 'Hidden item leaked to public menu');
    assert(!itemNames.includes(`Ghost Latte ${suffix}`), 'Inactive category item leaked');

    const searched = await api(port, null, `${menuPath}?search=cappuccino`);
    assert(searched.status === 200, `Search failed (${searched.status})`);
    assert(
      flattenItems(searched.body.data ?? {}).some((item) =>
        item.name.includes(`Cappuccino ${suffix}`),
      ),
      'Search did not find cappuccino',
    );

    const filtered = await api(
      port,
      null,
      `${menuPath}?categoryId=${activeCategoryId}&search=espresso`,
    );
    assert(filtered.status === 200, `Filter+search failed (${filtered.status})`);
    assert(
      flattenItems(filtered.body.data ?? {}).some((item) =>
        item.name.includes(`Cappuccino ${suffix}`),
      ),
      'AND filter/search missed matching item',
    );

    const noMatch = await api(
      port,
      null,
      `${menuPath}?categoryId=${activeCategoryId}&search=pizza`,
    );
    assert(flattenItems(noMatch.body.data ?? {}).length === 0, 'Expected empty AND filter result');

    const priceUpdate = await api(port, jar, `/api/admin/menu-items/${visibleItemId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ price: 135 }),
    });
    assert(priceUpdate.status === 200, 'Price update failed');

    const fresh = await api(port, null, menuPath);
    const updated = flattenItems(fresh.body.data ?? {}).find((item) =>
      item.name.includes(`Cappuccino ${suffix}`),
    );
    assert(updated !== undefined, 'Updated item missing after price change');
    assert(updated.price === 135, `Expected fresh price 135, got ${updated.price}`);

    const maintenance = await api(port, jar, '/api/admin/restaurant/status', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ status: 'MAINTENANCE' }),
    });
    assert(maintenance.status === 200, 'Failed to set maintenance');

    const maintenanceMenu = await api(port, null, menuPath);
    assert(maintenanceMenu.status === 503, `Expected 503 in maintenance, got ${maintenanceMenu.status}`);
    assert(maintenanceMenu.body.data?.status === 'MAINTENANCE', 'Maintenance payload missing');

    await api(port, jar, '/api/admin/restaurant/status', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    // Cleanup best-effort
    await api(port, jar, `/api/admin/menu-items/${visibleItemId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/menu-items/${hiddenItemId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    const ghostList = await api(port, jar, `/api/admin/menu-items?categoryId=${inactiveCategoryId}`);
    for (const item of ghostList.body.data?.items ?? []) {
      await api(port, jar, `/api/admin/menu-items/${item.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
      });
    }
    await api(port, jar, `/api/admin/categories/${activeCategoryId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/categories/${inactiveCategoryId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });

    console.log('PUBLIC_MENU_VERIFICATION_PASSED');
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
  console.error('PUBLIC_MENU_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
