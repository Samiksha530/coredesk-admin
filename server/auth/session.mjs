import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ACCESS_TOKEN_LIFETIME_SECONDS, signAccessToken, verifyAccessToken } from './token.mjs';
const lifetimeSeconds = 8 * 60 * 60;
const cookieName = 'coredesk_refresh';
const sessions = new Map();
const accounts = new Map([
  ['admin@coredesk.demo', { name: 'Alex Morgan', role: 'Admin' }],
  ['manager@coredesk.demo', { name: 'Sarah Kim', role: 'Manager' }],
  ['viewer@coredesk.demo', { name: 'James Wilson', role: 'Viewer' }],
]);
const digest = (value) => createHash('sha256').update(value).digest('hex');
function readCookie(request) {
  return (request.headers.cookie || '')
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}
function setCookie(response, token, maxAge = lifetimeSeconds) {
  response.setHeader(
    'Set-Cookie',
    `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
}
function issue(session, response) {
  const refreshToken = randomBytes(32).toString('base64url');
  session.refreshHash = digest(refreshToken);
  setCookie(response, refreshToken, Math.max(0, Math.floor((session.expires - Date.now()) / 1000)));
  return {
    name: session.name,
    email: session.email,
    role: session.role,
    token: signAccessToken(session),
    expiresAt: Date.now() + ACCESS_TOKEN_LIFETIME_SECONDS * 1000,
  };
}
export function login(credentials, response) {
  const account = accounts.get(credentials.email);
  if (!account || credentials.password !== 'Demo@123') return null;
  // Remove expired demo sessions without a background timer.
  for (const [id, value] of sessions) if (value.expires <= Date.now()) sessions.delete(id);
  const session = {
    id: randomUUID(),
    ...account,
    email: credentials.email,
    expires: Date.now() + lifetimeSeconds * 1000,
  };
  sessions.set(session.id, session);
  return issue(session, response);
}
export function refresh(request, response) {
  const token = readCookie(request);
  if (!token) return null;
  const hash = digest(token);
  const session = [...sessions.values()].find(
    (value) => value.refreshHash === hash && value.expires > Date.now(),
  );
  return session ? issue(session, response) : null;
}
export function authenticate(request) {
  const token = request.headers.authorization?.replace(/^Bearer /, '');
  const claims = token ? verifyAccessToken(token) : null;
  const session = claims ? sessions.get(claims.sid) : null;
  return session && session.expires > Date.now() && session.email === claims.sub ? session : null;
}
export function logout(request, response) {
  const token = readCookie(request);
  const session =
    authenticate(request) ||
    (token ? [...sessions.values()].find((value) => value.refreshHash === digest(token)) : null);
  if (session) sessions.delete(session.id);
  setCookie(response, '', 0);
}
