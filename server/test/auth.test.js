// Integration tests against a real (throwaway) MongoDB. Never point this at the dev database.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/auth_app_test';
process.env.JWT_SECRET ||= 'test-secret-'.repeat(4);

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');

const CLIENT_ORIGIN = 'http://localhost:5173';
const VALID = { name: 'Test User', email: 'test@example.com', password: 'password123' };

let server;
let baseUrl;

const call = (method, path, { body, token, origin } = {}) =>
  fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Cookie: `token=${token}` }),
      ...(origin && { Origin: origin }),
    },
    body: body && JSON.stringify(body),
  });

const tokenFrom = (res) => /token=([^;]+)/.exec(res.headers.getSetCookie().join(';'))?.[1];

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await User.init(); // make sure the unique email index exists before testing duplicates
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('POST /api/auth/register', () => {
  it('rejects missing and wrong-type fields with per-field errors', async () => {
    const res = await call('POST', '/auth/register', { body: { name: 5, email: { $gt: '' }, password: ['x'] } });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.deepEqual(Object.keys(data.errors).sort(), ['email', 'name', 'password']);
  });

  it('creates a user, normalizes the email, hides the password and sets an httpOnly cookie', async () => {
    const res = await call('POST', '/auth/register', {
      body: { ...VALID, name: '  Test User ', email: '  TEST@Example.com ', isAdmin: true },
    });
    assert.equal(res.status, 201);
    const { user } = await res.json();
    assert.equal(user.email, 'test@example.com');
    assert.equal(user.name, 'Test User');
    assert.equal(user.password, undefined);
    assert.equal(user.role, 'customer');
    assert.equal(user.isAdmin, undefined);
    assert.match(res.headers.getSetCookie().join(';'), /HttpOnly/i);

    const stored = await User.findOne({ email: 'test@example.com' }).select('+password').lean();
    assert.match(stored.password, /^\$2[aby]\$12\$/);
    assert.equal(stored.role, 'customer');
    assert.equal(stored.isAdmin, undefined);
  });

  it('rejects a role that is not self-assignable', async () => {
    const res = await call('POST', '/auth/register', { body: { ...VALID, email: 'r@example.com', role: 'admin' } });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).errors.role);
  });

  it('rejects a duplicate email regardless of case', async () => {
    const res = await call('POST', '/auth/register', { body: { ...VALID, email: 'TEST@example.COM' } });
    assert.equal(res.status, 409);
  });

  it('rejects passwords over 72 bytes even when they are under 72 characters', async () => {
    const res = await call('POST', '/auth/register', { body: { ...VALID, email: 'b@example.com', password: 'é'.repeat(40) } });
    assert.equal(res.status, 400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await call('POST', '/auth/login', { body: { email: 'Test@Example.com', password: VALID.password } });
    assert.equal(res.status, 200);
    assert.ok(tokenFrom(res));
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const wrong = await call('POST', '/auth/login', { body: { email: VALID.email, password: 'wrongpass1' } });
    const unknown = await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'password123' } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(await wrong.json(), await unknown.json());
  });
});

describe('GET /api/auth/me', () => {
  let token;
  before(async () => {
    token = tokenFrom(await call('POST', '/auth/login', { body: { email: VALID.email, password: VALID.password } }));
  });

  it('returns the safe profile for a valid session', async () => {
    const res = await call('GET', '/auth/me', { token });
    assert.equal(res.status, 200);
    const { user } = await res.json();
    assert.equal(user.email, VALID.email);
    assert.equal(user.password, undefined);
  });

  it('returns 401 without a session', async () => {
    assert.equal((await call('GET', '/auth/me')).status, 401);
  });

  it('rejects forged, wrong-algorithm and expired tokens', async () => {
    const id = jwt.decode(token).id;
    const secret = process.env.JWT_SECRET;
    const forged = [
      jwt.sign({ id }, 'other-secret'),
      jwt.sign({ id }, secret, { algorithm: 'HS512' }),
      `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ id })).toString('base64url')}.`,
    ];
    for (const bad of forged) assert.equal((await call('GET', '/auth/me', { token: bad })).status, 401);

    const expired = await call('GET', '/auth/me', { token: jwt.sign({ id }, secret, { expiresIn: -10 }) });
    assert.equal(expired.status, 401);
    assert.equal((await expired.json()).message, 'Session expired');
  });
});

describe('POST /api/auth/logout and CSRF origin check', () => {
  it('revokes the token so a copied cookie stops working', async () => {
    const token = tokenFrom(await call('POST', '/auth/login', { body: { email: VALID.email, password: VALID.password } }));
    assert.equal((await call('GET', '/auth/me', { token })).status, 200);

    const out = await call('POST', '/auth/logout', { token, origin: CLIENT_ORIGIN });
    assert.equal(out.status, 200);
    assert.equal((await call('GET', '/auth/me', { token })).status, 401);
  });

  it('succeeds with no or an invalid cookie', async () => {
    assert.equal((await call('POST', '/auth/logout')).status, 200);
    assert.equal((await call('POST', '/auth/logout', { token: 'junk' })).status, 200);
  });

  it('blocks state-changing requests from other origins', async () => {
    const res = await call('POST', '/auth/login', { body: { email: VALID.email, password: VALID.password }, origin: 'http://evil.com' });
    assert.equal(res.status, 403);
  });
});

describe('error handling', () => {
  it('returns JSON 404 for unknown routes and 400 for malformed JSON', async () => {
    assert.equal((await call('GET', '/nope')).status, 404);
    const res = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    assert.equal(res.status, 400);
  });
});
