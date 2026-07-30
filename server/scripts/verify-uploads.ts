import 'dotenv/config';
import { access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { uploadConfig } from '../src/config/upload.js';
import { ensureUploadDirectories } from '../src/services/storage.service.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    category?: { id: string };
    item?: { id: string; image: string | null };
    restaurant?: { logo: string | null; coverImage: string | null };
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
  route: string,
  init: RequestInit = {},
): Promise<{ status: number; body: JsonBody }> {
  const headers = new Headers(init.headers);
  const cookieHeader = jar.header;

  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
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

async function createPngBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 15, g: 118, b: 110 },
    },
  })
    .png()
    .toBuffer();
}

function toAbsoluteUploadPath(publicPath: string): string {
  const relative = publicPath.replace(new RegExp(`^${uploadConfig.publicPathPrefix}/?`), '');
  return path.join(uploadConfig.uploadsRoot, relative);
}

async function main(): Promise<void> {
  await ensureUploadDirectories();

  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  assert(address && typeof address === 'object', 'Failed to bind test server');

  const port = address.port;
  const jar = new CookieJar();
  const suffix = Date.now().toString(36);

  try {
    await login(port, jar);

    const category = await api(port, jar, '/api/admin/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ name: `Upload Cat ${suffix}` }),
    });
    assert(category.status === 201, `Category create failed (${category.status})`);
    const categoryId = category.body.data?.category?.id;
    assert(typeof categoryId === 'string', 'Category id missing');

    const item = await api(port, jar, '/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        categoryId,
        name: `Upload Item ${suffix}`,
        price: 99,
      }),
    });
    assert(item.status === 201, `Item create failed (${item.status})`);
    const itemId = item.body.data?.item?.id;
    assert(typeof itemId === 'string', 'Item id missing');

    const png = await createPngBuffer();
    const form = new FormData();
    form.append('image', new Blob([png], { type: 'image/png' }), 'sample.png');

    const uploaded = await api(port, jar, `/api/admin/menu-items/${itemId}/image`, {
      method: 'POST',
      headers: {
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: form,
    });
    assert(uploaded.status === 200, `Upload failed (${uploaded.status}): ${uploaded.body.message}`);
    const imagePath = uploaded.body.data?.item?.image;
    assert(typeof imagePath === 'string', 'Uploaded image path missing');
    assert(imagePath.endsWith('.webp') || imagePath.includes('cloudinary.com'), 'Uploaded image should be webp or Cloudinary URL');

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      const remote = await fetch(imagePath);
      assert(remote.status === 200, `Cloudinary image fetch failed (${remote.status})`);
    } else {
      await access(toAbsoluteUploadPath(imagePath));
      const staticResponse = await fetch(`http://127.0.0.1:${port}${imagePath}`);
      assert(staticResponse.status === 200, `Static image serve failed (${staticResponse.status})`);
    }
    const rejected = await api(port, jar, `/api/admin/menu-items/${itemId}/image`, {
      method: 'POST',
      headers: {
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: (() => {
        const bad = new FormData();
        bad.append('image', new Blob(['not-an-image'], { type: 'text/plain' }), 'bad.txt');
        return bad;
      })(),
    });
    assert(rejected.status === 400, `Expected 400 for invalid type, got ${rejected.status}`);

    const logoForm = new FormData();
    logoForm.append('image', new Blob([png], { type: 'image/png' }), 'logo.png');
    const logo = await api(port, jar, '/api/admin/restaurant/logo', {
      method: 'POST',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
      body: logoForm,
    });
    assert(logo.status === 200, `Logo upload failed (${logo.status})`);
    assert(typeof logo.body.data?.restaurant?.logo === 'string', 'Logo path missing');

    const coverForm = new FormData();
    coverForm.append('image', new Blob([png], { type: 'image/png' }), 'cover.png');
    const cover = await api(port, jar, '/api/admin/restaurant/cover', {
      method: 'POST',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
      body: coverForm,
    });
    assert(cover.status === 200, `Cover upload failed (${cover.status})`);
    assert(typeof cover.body.data?.restaurant?.coverImage === 'string', 'Cover path missing');

    const removed = await api(port, jar, `/api/admin/menu-items/${itemId}/image`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    assert(removed.status === 200, `Remove image failed (${removed.status})`);
    assert(removed.body.data?.item?.image === null, 'Image was not cleared');

    await api(port, jar, '/api/admin/restaurant/logo', {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, '/api/admin/restaurant/cover', {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/menu-items/${itemId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });
    await api(port, jar, `/api/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': jar.get('csrf_token') ?? '' },
    });

    console.log('UPLOAD_VERIFICATION_PASSED');
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
  console.error('UPLOAD_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
