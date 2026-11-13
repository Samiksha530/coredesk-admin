import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = await mkdtemp(join(tmpdir(), 'coredesk-vercel-test-'));
process.env.COREDESK_DATA_DIR = directory;
const { default: handler } = await import('../api/index.mjs');
const server = http.createServer(async (request, response) => {
  if (request.method === 'POST') {
    let body = '';
    for await (const chunk of request) body += chunk;
    request.body = JSON.parse(body || '{}');
  }
  await handler(request, response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
});
test('serverless rewrites preserve protected API routing', async () => {
  const response = await fetch(base + '/api?route=users');
  assert.equal(response.status, 401);
});
test('serverless handler accepts Vercel pre-parsed bodies and preserves query parameters', async () => {
  const login = await fetch(base + '/api?route=auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@coredesk.demo', password: 'Demo@123' }),
  });
  assert.equal(login.status, 200);
  const session = await login.json();
  const response = await fetch(base + '/api?route=analytics&period=90', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).revenue, 48295 * 3);
});
