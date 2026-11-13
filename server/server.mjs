import { login, refresh, logout, authenticate } from './auth/session.mjs';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getRepository } from './storage/repository.mjs';
export async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, data) => {
    res.writeHead(status);
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, 'http://localhost');
    const store = await getRepository();
    const audit = (action, actor) =>
      store.appendAudit({ id: randomUUID(), action, actor, date: new Date().toISOString() });
    let body = {};
    if (req.body !== undefined) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (['POST', 'PUT'].includes(req.method)) {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 12000) {
          send(413, { message: 'Request too large' });
          return;
        }
      }
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        send(400, { message: 'Invalid JSON' });
        return;
      }
    }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const session = await login(body, res);
      if (!session) {
        send(401, { message: 'Invalid demo email or password.' });
        return;
      }
      await audit('Signed in to workspace', session.email);
      send(200, session);
      return;
    }
    if (url.pathname === '/api/auth/refresh' && req.method === 'POST') {
      const session = await refresh(req, res);
      send(session ? 200 : 401, session || { message: 'Session expired. Please sign in again.' });
      return;
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      await logout(req, res);
      send(200, { ok: true });
      return;
    }
    const session = await authenticate(req);
    if (!session) {
      send(401, { message: 'Session expired. Please sign in again.' });
      return;
    }
    if (url.pathname === '/api/analytics' && req.method === 'GET') {
      const m =
        url.searchParams.get('period') === '365'
          ? 12
          : url.searchParams.get('period') === '90'
            ? 3
            : 1;
      send(200, {
        revenue: 48295 * m,
        growth: 12.8,
        customers: Math.round(2847 * Math.sqrt(m)),
        conversion: 3.62,
        series: [12, 18, 16, 25, 21, 29, 24, 34, 32, 42, 38, 47, 44, 54, 51, 58].map(
          (v) => v - (m === 3 ? 6 : m === 12 ? 10 : 0),
        ),
      });
      return;
    }
    if (url.pathname === '/api/audit' && req.method === 'GET') {
      send(200, await store.listAudit());
      return;
    }
    if (url.pathname === '/api/users' && req.method === 'GET') {
      send(200, await store.listUsers());
      return;
    }
    if (
      /^\/api\/users(?:\/[^/]+)?$/.test(url.pathname) &&
      ['POST', 'PUT', 'DELETE'].includes(req.method)
    ) {
      if (session.role === 'Viewer') {
        send(403, { message: 'Viewers have read-only access.' });
        return;
      }
      const id = url.pathname.split('/')[3];
      const existing = await store.getUser(id);
      if (req.method !== 'POST' && !existing) {
        send(404, { message: 'Member not found.' });
        return;
      }
      if (
        session.role === 'Manager' &&
        (existing?.role === 'Admin' || body.role === 'Admin' || req.method === 'DELETE')
      ) {
        send(403, { message: 'Only admins can perform this action.' });
        return;
      }
      if (req.method === 'DELETE') {
        if (existing.email === session.email) {
          send(409, { message: 'You cannot remove your own account.' });
          return;
        }
        await store.deleteUser(id);
        await audit(`Removed member: ${existing.name}`, session.email);
        send(200, { ok: true });
        return;
      }
      const { name, email, role, status, department } = body;
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.length > 80 ||
        typeof email !== 'string' ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        !['Admin', 'Manager', 'Viewer'].includes(role) ||
        !['Active', 'Invited', 'Suspended'].includes(status) ||
        typeof department !== 'string' ||
        !department.trim() ||
        department.length > 60
      ) {
        send(400, { message: 'Provide valid name, email, department, role and status.' });
        return;
      }
      const user = {
        id: existing?.id || randomUUID(),
        name: name.trim(),
        email: email.toLowerCase(),
        role,
        status,
        department: department.trim(),
        joined: existing?.joined || new Date().toISOString().slice(0, 10),
      };
      await store.saveUser(user);
      await audit(`${existing ? 'Updated' : 'Added'} member: ${user.name}`, session.email);
      send(existing ? 200 : 201, user);
      return;
    }
    send(404, { message: 'Endpoint not found.' });
  } catch (err) {
    if (err.code === '23505') {
      send(409, { message: 'A member with this email already exists.' });
      return;
    }
    console.error('API request failed:', err.code || err.message);
    if (!res.headersSent)
      send(503, { message: 'API storage is unavailable. Please try again later.' });
    else res.end();
  }
}
export const server = http.createServer(handler);
if (process.argv[1] === fileURLToPath(import.meta.url))
  server.listen(3001, '127.0.0.1', () =>
    console.log('CoreDesk mock REST API: http://127.0.0.1:3001'),
  );
