import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dataDirectory = await mkdtemp(join(tmpdir(), 'coredesk-api-test-'));
process.env.COREDESK_DATA_DIR = dataDirectory;
const { server } = await import('./server.mjs');
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDirectory, { recursive: true, force: true });
});
const request = async (path, method = 'GET', body, token) => {
  const r = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, body: await r.json(), cookie: r.headers.get('set-cookie') };
};
test('unauthenticated requests rejected', async () =>
  assert.equal((await request('/api/users')).status, 401));
test('invalid login rejected', async () =>
  assert.equal(
    (await request('/api/auth/login', 'POST', { email: 'admin@coredesk.demo', password: 'wrong' }))
      .status,
    401,
  ));
test('viewer and manager permissions enforced', async () => {
  for (const [email, role] of [
    ['viewer@coredesk.demo', 'Viewer'],
    ['manager@coredesk.demo', 'Admin'],
  ]) {
    const s = await request('/api/auth/login', 'POST', { email, password: 'Demo@123' });
    assert.equal(
      (
        await request(
          '/api/users',
          'POST',
          { name: 'Test', email: 'test@example.com', role, status: 'Active', department: 'QA' },
          s.body.token,
        )
      ).status,
      403,
    );
  }
});
test('admin CRUD, duplicate validation and audit', async () => {
  const { body: s } = await request('/api/auth/login', 'POST', {
    email: 'admin@coredesk.demo',
    password: 'Demo@123',
  });
  const member = {
    name: 'Test Member',
    email: `test-${Date.now()}@example.com`,
    role: 'Viewer',
    status: 'Active',
    department: 'QA',
  };
  const created = await request('/api/users', 'POST', member, s.token);
  assert.equal(created.status, 201);
  try {
    assert.equal((await request('/api/users', 'POST', member, s.token)).status, 409);
    assert.equal(
      (
        await request(
          '/api/users/' + created.body.id,
          'PUT',
          { ...member, name: 'Updated Member' },
          s.token,
        )
      ).body.name,
      'Updated Member',
    );
    assert.ok(
      (await request('/api/audit', 'GET', null, s.token)).body.some((e) =>
        e.action.includes('Updated Member'),
      ),
    );
  } finally {
    assert.equal(
      (await request('/api/users/' + created.body.id, 'DELETE', null, s.token)).status,
      200,
    );
  }
});

test('refresh cookie rotates and logout revokes the session', async () => {
  const loginResponse = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@coredesk.demo', password: 'Demo@123' }),
  });
  const loginBody = await loginResponse.json();
  const cookieHeader = loginResponse.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Strict/);
  const cookie = cookieHeader.split(';')[0];
  const refreshed = await fetch(base + '/api/auth/refresh', {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(refreshed.status, 200);
  const newCookie = refreshed.headers.get('set-cookie').split(';')[0];
  assert.notEqual(newCookie, cookie);
  const replay = await fetch(base + '/api/auth/refresh', {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(replay.status, 401);
  const logoutResponse = await fetch(base + '/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: newCookie, Authorization: `Bearer ${loginBody.token}` },
  });
  assert.equal(logoutResponse.status, 200);
  assert.equal((await request('/api/users', 'GET', null, loginBody.token)).status, 401);
  const afterLogout = await fetch(base + '/api/auth/refresh', {
    method: 'POST',
    headers: { Cookie: newCookie },
  });
  assert.equal(afterLogout.status, 401);
});
