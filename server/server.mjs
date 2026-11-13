import { login, refresh, logout, authenticate } from './auth/session.mjs';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const dir = process.env.COREDESK_DATA_DIR
  ? pathToFileURL(resolve(process.env.COREDESK_DATA_DIR) + '/')
  : new URL('./data/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('db.json', dir);
const names = [
  'Alex Morgan',
  'Sarah Kim',
  'James Wilson',
  'Emma Davis',
  'Oliver Chen',
  'Priya Sharma',
  'Noah Williams',
  'Mia Johnson',
  'Liam Patel',
  'Sophia Brown',
  'Ethan Miller',
  'Ava Garcia',
  'Lucas Martin',
  'Isabella Lee',
  'Mason Clark',
  'Amelia Lewis',
  'Logan Walker',
  'Harper Hall',
  'Elijah Young',
  'Charlotte Allen',
  'Henry King',
  'Evelyn Wright',
  'Daniel Scott',
  'Grace Green',
];
const seed = {
  users: names.map((name, i) => ({
    id: String(i + 1),
    name,
    email:
      i === 0 ? 'admin@coredesk.demo' : name.toLowerCase().replace(' ', '.') + '@coredesk.demo',
    role: i === 0 ? 'Admin' : i % 5 === 0 ? 'Manager' : 'Viewer',
    status: i % 7 === 5 ? 'Invited' : i % 11 === 8 ? 'Suspended' : 'Active',
    department: ['Engineering', 'Design', 'Marketing', 'Operations'][i % 4],
    joined: `2026-${String(3 + (i % 8)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}`,
  })),
  audit: [
    {
      id: randomUUID(),
      action: 'Workspace created',
      actor: 'System',
      date: new Date().toISOString(),
    },
  ],
};
let db;
try {
  db = JSON.parse(await readFile(file, 'utf8'));
} catch {
  db = seed;
  await writeFile(file, JSON.stringify(db, null, 2));
}
let writes = Promise.resolve();
const persist = () => {
  const snapshot = JSON.stringify(db, null, 2);
  writes = writes.then(() => writeFile(file, snapshot));
  return writes;
};
const audit = (action, actor) => {
  db.audit.unshift({ id: randomUUID(), action, actor, date: new Date().toISOString() });
  db.audit = db.audit.slice(0, 100);
};
export const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, data) => {
    res.writeHead(status);
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, 'http://localhost');
    let body = {};
    if (['POST', 'PUT'].includes(req.method)) {
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
      const session = login(body, res);
      if (!session) {
        send(401, { message: 'Invalid demo email or password.' });
        return;
      }
      audit('Signed in to workspace', session.email);
      await persist();
      send(200, session);
      return;
    }
    if (url.pathname === '/api/auth/refresh' && req.method === 'POST') {
      const session = refresh(req, res);
      send(session ? 200 : 401, session || { message: 'Session expired. Please sign in again.' });
      return;
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      logout(req, res);
      send(200, { ok: true });
      return;
    }
    const session = authenticate(req);
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
      send(200, db.audit);
      return;
    }
    if (url.pathname === '/api/users' && req.method === 'GET') {
      send(200, db.users);
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
      const existing = db.users.find((u) => u.id === id);
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
        db.users = db.users.filter((u) => u.id !== id);
        audit(`Removed member: ${existing.name}`, session.email);
        await persist();
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
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id)) {
        send(409, { message: 'A member with this email already exists.' });
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
      if (existing) db.users = db.users.map((u) => (u.id === id ? user : u));
      else db.users.push(user);
      audit(`${existing ? 'Updated' : 'Added'} member: ${user.name}`, session.email);
      await persist();
      send(existing ? 200 : 201, user);
      return;
    }
    send(404, { message: 'Endpoint not found.' });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(500, { message: 'Unexpected server error.' });
    else res.end();
  }
});
if (process.argv[1] === fileURLToPath(import.meta.url))
  server.listen(3001, '127.0.0.1', () =>
    console.log('CoreDesk mock REST API: http://127.0.0.1:3001'),
  );
