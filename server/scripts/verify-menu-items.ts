import 'dotenv/config';
import { createApp } from '../src/app.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    category?: { id: string };
    item?: {
      id: string;
      name: string;
      price: number;
      currency: string;
      isAvailable: boolean;
      categoryId: string;
    };
    items?: Array<{ id: string; name: string; displayOrder: number }>;
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
    const unauthorized = await api(port, jar, '/api/admin/menu-items');
    assert(unauthorized.status === 401, `Expected 401, got ${unauthorized.status}`);

    await login(port, jar);

    const categoryA = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Coffee Cat ${suffix}`, displayOrder: 1 }),
    });
    assert(categoryA.status === 201, `Category A create failed (${categoryA.status})`);
    const categoryAId = categoryA.body.data?.category?.id;
    assert(typeof categoryAId === 'string', 'Category A id missing');

    const categoryB = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Dessert Cat ${suffix}`, displayOrder: 2 }),
    });
    assert(categoryB.status === 201, `Category B create failed (${categoryB.status})`);
    const categoryBId = categoryB.body.data?.category?.id;
    assert(typeof categoryBId === 'string', 'Category B id missing');

    const invalidPrice = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: categoryAId,
        name: `Latte ${suffix}`,
        price: 0,
      }),
    });
    assert(invalidPrice.status === 400, `Expected 400 for price <= 0, got ${invalidPrice.status}`);

    const created = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: categoryAId,
        name: `Latte ${suffix}`,
        description: 'Espresso with steamed milk',
        price: 120,
        displayOrder: 1,
      }),
    });
    assert(created.status === 201, `Create failed (${created.status}): ${created.body.message}`);
    const itemId = created.body.data?.item?.id;
    assert(typeof itemId === 'string', 'Item id missing');
    assert(created.body.data?.item?.currency === 'ETB', 'Currency must be ETB');
    assert(created.body.data?.item?.price === 120, 'Price mismatch');

    const duplicateSameCategory = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: categoryAId,
        name: `Latte ${suffix}`,
        price: 130,
      }),
    });
    assert(
      duplicateSameCategory.status === 409,
      `Expected 409 for duplicate name in category, got ${duplicateSameCategory.status}`,
    );

    const duplicateOtherCategory = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId: categoryBId,
        name: `Latte ${suffix}`,
        price: 140,
        displayOrder: 1,
      }),
    });
    assert(
      duplicateOtherCategory.status === 201,
      `Duplicate name in other category should be allowed (${duplicateOtherCategory.status})`,
    );
    const secondItemId = duplicateOtherCategory.body.data?.item?.id;
    assert(typeof secondItemId === 'string', 'Second item id missing');

    const priceUpdate = await api(port, jar, `/api/admin/menu-items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ price: 125 }),
    });
    assert(priceUpdate.status === 200, `Price update failed (${priceUpdate.status})`);
    assert(priceUpdate.body.data?.item?.price === 125, 'Price was not updated');

    const hidden = await api(port, jar, `/api/admin/menu-items/${itemId}/availability`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ isAvailable: false }),
    });
    assert(hidden.status === 200, `Availability update failed (${hidden.status})`);
    assert(hidden.body.data?.item?.isAvailable === false, 'Item still available');

    const listed = await api(
      port,
      jar,
      `/api/admin/menu-items?categoryId=${categoryAId}&search=Latte`,
    );
    assert(listed.status === 200, `List failed (${listed.status})`);
    assert((listed.body.data?.pagination?.total ?? 0) >= 1, 'Search/filter returned no items');

    const reordered = await api(port, jar, '/api/admin/menu-items/reorder', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        items: [
          { id: secondItemId, displayOrder: 0 },
          { id: itemId, displayOrder: 2 },
        ],
      }),
    });
    assert(reordered.status === 200, `Reorder failed (${reordered.status})`);

    const deleted = await api(port, jar, `/api/admin/menu-items/${itemId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    assert(deleted.status === 200, `Delete failed (${deleted.status})`);

    await api(port, jar, `/api/admin/menu-items/${secondItemId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/categories/${categoryAId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/categories/${categoryBId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });

    console.log('MENU_ITEM_VERIFICATION_PASSED');
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
  console.error('MENU_ITEM_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
