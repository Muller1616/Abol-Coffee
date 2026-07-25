import 'dotenv/config';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    menuUrl?: string;
    pngDataUrl?: string;
    svg?: string;
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
): Promise<{ status: number; body: JsonBody; contentType: string | null; bytes?: ArrayBuffer }> {
  const headers = new Headers(init.headers);
  if (jar.header) headers.set('cookie', jar.header);

  const response = await fetch(`http://127.0.0.1:${port}${route}`, { ...init, headers });
  jar.absorb(response.headers.getSetCookie());

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return {
      status: response.status,
      body: (await response.json()) as JsonBody,
      contentType,
    };
  }

  return {
    status: response.status,
    body: {},
    contentType,
    bytes: await response.arrayBuffer(),
  };
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  assert(address && typeof address === 'object', 'Failed to bind test server');

  const port = address.port;
  const jar = new CookieJar();

  try {
    const unauthorized = await api(port, jar, '/api/admin/qr');
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

    const preview = await api(port, jar, '/api/admin/qr');
    assert(preview.status === 200, `QR preview failed (${preview.status})`);
    assert(preview.body.data?.menuUrl === env.PUBLIC_MENU_URL, 'QR menu URL mismatch');
    assert(preview.body.data?.pngDataUrl?.startsWith('data:image/png') ?? false, 'PNG data URL missing');
    assert(preview.body.data?.svg?.includes('<svg') ?? false, 'SVG missing');

    const again = await api(port, jar, '/api/admin/qr/url');
    assert(again.body.data?.menuUrl === env.PUBLIC_MENU_URL, 'Permanent URL changed unexpectedly');

    const png = await api(port, jar, '/api/admin/qr/png');
    assert(png.status === 200, `PNG download failed (${png.status})`);
    assert(png.contentType?.includes('image/png') ?? false, 'PNG content-type mismatch');
    assert((png.bytes?.byteLength ?? 0) > 0, 'PNG payload empty');

    const svg = await api(port, jar, '/api/admin/qr/svg');
    assert(svg.status === 200, `SVG download failed (${svg.status})`);
    assert(svg.contentType?.includes('image/svg+xml') ?? false, 'SVG content-type mismatch');
    assert((svg.bytes?.byteLength ?? 0) > 0, 'SVG payload empty');

    console.log('QR_VERIFICATION_PASSED');
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
  console.error('QR_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
