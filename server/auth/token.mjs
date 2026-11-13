import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
if (
  process.env.VERCEL &&
  (!process.env.COREDESK_JWT_SECRET || process.env.COREDESK_JWT_SECRET.length < 32)
)
  throw new Error('COREDESK_JWT_SECRET must be set to a random secret of at least 32 characters.');
const secret = process.env.COREDESK_JWT_SECRET || randomBytes(32).toString('hex');
const issuer = 'coredesk-api';
const audience = 'coredesk-web';
export const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;
export function signAccessToken(session, now = Date.now()) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: session.email,
      name: session.name,
      role: session.role,
      sid: session.id,
      iss: issuer,
      aud: audience,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + ACCESS_TOKEN_LIFETIME_SECONDS,
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
export function verifyAccessToken(token, now = Date.now()) {
  try {
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra) return null;
    const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
    const received = Buffer.from(signature, 'base64url');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const metadata = JSON.parse(Buffer.from(header, 'base64url').toString());
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (
      metadata.alg !== 'HS256' ||
      metadata.typ !== 'JWT' ||
      claims.iss !== issuer ||
      claims.aud !== audience ||
      typeof claims.exp !== 'number' ||
      claims.exp <= Math.floor(now / 1000) ||
      typeof claims.sid !== 'string' ||
      typeof claims.sub !== 'string'
    )
      return null;
    return claims;
  } catch {
    return null;
  }
}
