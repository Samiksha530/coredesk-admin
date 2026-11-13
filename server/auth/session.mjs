import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ACCESS_TOKEN_LIFETIME_SECONDS, signAccessToken, verifyAccessToken } from './token.mjs';
import { getRepository } from '../storage/repository.mjs';
const lifetimeSeconds = 8 * 60 * 60;
const cookieName = 'coredesk_refresh';
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
function issue(session, response, refreshToken) {
  setCookie(response, refreshToken, Math.max(0, Math.floor((session.expires - Date.now()) / 1000)));
  return {
    name: session.name,
    email: session.email,
    role: session.role,
    token: signAccessToken(session),
    expiresAt: Date.now() + ACCESS_TOKEN_LIFETIME_SECONDS * 1000,
  };
}
export async function login(credentials, response) {
  const account = accounts.get(credentials.email);
  if (!account || credentials.password !== 'Demo@123') return null;
  const refreshToken = randomBytes(32).toString('base64url');
  const session = {
    id: randomUUID(),
    ...account,
    email: credentials.email,
    expires: Date.now() + lifetimeSeconds * 1000,
    refreshHash: digest(refreshToken),
  };
  await (await getRepository()).createSession(session);
  return issue(session, response, refreshToken);
}
export async function refresh(request, response) {
  const token = readCookie(request);
  if (!token) return null;
  const store = await getRepository();
  const oldHash = digest(token);
  const session = await store.findSession(oldHash);
  if (!session) return null;
  const refreshToken = randomBytes(32).toString('base64url');
  if (!(await store.rotateSession(session.id, oldHash, digest(refreshToken)))) return null;
  return issue(session, response, refreshToken);
}
export async function authenticate(request) {
  const token = request.headers.authorization?.replace(/^Bearer /, '');
  const claims = token ? verifyAccessToken(token) : null;
  if (!claims) return null;
  const session = await (await getRepository()).getSession(claims.sid);
  return session && session.email === claims.sub ? session : null;
}
export async function logout(request, response) {
  const store = await getRepository();
  const token = readCookie(request);
  const session =
    (await authenticate(request)) || (token ? await store.findSession(digest(token)) : null);
  if (session) await store.deleteSession(session.id);
  setCookie(response, '', 0);
}
