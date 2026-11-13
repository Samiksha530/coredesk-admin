import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signAccessToken, verifyAccessToken } from './token.mjs';
const session = {
  id: 'test-session',
  email: 'admin@coredesk.demo',
  name: 'Alex Morgan',
  role: 'Admin',
};
test('JWT verifies expected signed claims', () => {
  const token = signAccessToken(session);
  assert.equal(token.split('.').length, 3);
  assert.equal(verifyAccessToken(token).role, 'Admin');
});
test('tampered JWT payload is rejected', () => {
  const [header, , signature] = signAccessToken(session).split('.');
  const forged = Buffer.from(JSON.stringify({ role: 'Admin', exp: 9999999999 })).toString(
    'base64url',
  );
  assert.equal(verifyAccessToken(`${header}.${forged}.${signature}`), null);
});
test('expired JWT is rejected', () => {
  assert.equal(verifyAccessToken(signAccessToken(session, 0)), null);
});
