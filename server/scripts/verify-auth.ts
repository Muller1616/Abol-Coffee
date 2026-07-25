import 'dotenv/config';
import { createApp } from '../src/app.js';

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: {
    csrfToken?: string;
    owner?: { id: string; email: string };
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

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  assert(address && typeof address === 'object', 'Failed to bind test server');

  const port = address.port;
  const jar = new CookieJar();
  const email = (process.env.OWNER_EMAIL ?? 'owner@abolcoffee.com').toLowerCase();
  const password = process.env.OWNER_PASSWORD ?? 'ChangeMe123!';
  const rotatedPassword = `${password}-rotated`;

  try {
    const csrf = await api(port, jar, '/api/auth/csrf');
    assert(csrf.status === 200, `CSRF failed (${csrf.status})`);
    assert(typeof csrf.body.data?.csrfToken === 'string', 'CSRF token missing in body');
    assert(jar.get('csrf_token') === csrf.body.data.csrfToken, 'CSRF cookie mismatch');

    const badLogin = await api(port, jar, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ email, password: 'wrong-password', rememberMe: false }),
    });
    assert(badLogin.status === 401, `Expected bad login 401, got ${badLogin.status}`);

    // Refresh CSRF after failed attempt (cookie may still be valid).
    const csrfLogin = await api(port, jar, '/api/auth/csrf');
    assert(csrfLogin.status === 200, 'Failed to refresh CSRF before login');

    const login = await api(port, jar, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ email, password, rememberMe: true }),
    });
    assert(login.status === 200, `Login failed (${login.status}): ${login.body.message}`);
    assert(Boolean(jar.get('access_token')), 'access_token cookie was not set');
    assert(typeof login.body.data?.csrfToken === 'string', 'Login CSRF token missing');

    const me = await api(port, jar, '/api/auth/me');
    assert(me.status === 200, `Me failed (${me.status})`);
    assert(me.body.data?.owner?.email === email, 'Authenticated owner email mismatch');

    const changePassword = await api(port, jar, '/api/auth/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        currentPassword: password,
        newPassword: rotatedPassword,
        confirmPassword: rotatedPassword,
      }),
    });
    assert(
      changePassword.status === 200,
      `Change password failed (${changePassword.status}): ${changePassword.body.message}`,
    );

    const logout = await api(port, jar, '/api/auth/logout', {
      method: 'POST',
      headers: {
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
    });
    assert(logout.status === 200, `Logout failed (${logout.status})`);

    const meAfterLogout = await api(port, jar, '/api/auth/me');
    assert(meAfterLogout.status === 401, `Expected 401 after logout, got ${meAfterLogout.status}`);

    // Restore original password so local seed credentials stay stable.
    await api(port, jar, '/api/auth/csrf');
    const relogin = await api(port, jar, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({ email, password: rotatedPassword, rememberMe: false }),
    });
    assert(relogin.status === 200, `Re-login failed (${relogin.status})`);

    const restore = await api(port, jar, '/api/auth/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': jar.get('csrf_token') ?? '',
      },
      body: JSON.stringify({
        currentPassword: rotatedPassword,
        newPassword: password,
        confirmPassword: password,
      }),
    });
    assert(restore.status === 200, `Password restore failed (${restore.status})`);

    console.log('AUTH_VERIFICATION_PASSED');
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
  console.error('AUTH_VERIFICATION_FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
