// Own database so this file can run in parallel with auth.test.js, which drops its database.
process.env.NODE_ENV = 'test';
const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/auth_app_test';
process.env.MONGODB_URI = TEST_URI.replace(/(\/[^/?]+)(\?|$)/, '$1_products$2');
process.env.JWT_SECRET ||= 'test-secret-'.repeat(4);
process.env.BCRYPT_ROUNDS = '10'; // tests only; faster hashing

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

const PRODUCT = { title: 'Mug', price: 12.5, stock: 3, description: 'A nice mug' };

let server;
let baseUrl;
const tokens = {};

const call = (method, path, { body, token } = {}) =>
  fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Cookie: `token=${token}` }) },
    body: body && JSON.stringify(body),
  });

const register = async (name, role) => {
  const res = await call('POST', '/auth/register', {
    body: { name, email: `${name}@example.com`, password: 'password123', ...(role && { role }) },
  });
  assert.equal(res.status, 201);
  return /token=([^;]+)/.exec(res.headers.getSetCookie().join(';'))[1];
};

const createProduct = async (token, overrides = {}) => {
  const res = await call('POST', '/products', { token, body: { ...PRODUCT, ...overrides } });
  return { res, data: await res.clone().json() };
};

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Product.init()]);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
  tokens.alice = await register('alice', 'merchant');
  tokens.bob = await register('bob', 'merchant');
  tokens.carol = await register('carol'); // defaults to customer
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('merchant create', () => {
  it('creates a product owned by the authenticated merchant and ignores a supplied vendorId', async () => {
    const aliceId = (await User.findOne({ email: 'alice@example.com' })).id;
    const { res, data } = await createProduct(tokens.alice, { vendorId: new mongoose.Types.ObjectId().toString() });
    assert.equal(res.status, 201);
    assert.equal(data.product.vendorId, aliceId);
    assert.equal(data.product.title, 'Mug');
  });

  it('requires authentication and the merchant role', async () => {
    assert.equal((await createProduct(undefined)).res.status, 401);
    assert.equal((await createProduct(tokens.carol)).res.status, 403);
  });

  it('rejects invalid input with per-field errors', async () => {
    const bad = [
      [{ title: '' }, 'title'],
      [{ price: 0 }, 'price'],
      [{ price: -5 }, 'price'],
      [{ price: '10' }, 'price'],
      [{ price: 1.999 }, 'price'],
      [{ stock: -1 }, 'stock'],
      [{ stock: 1.5 }, 'stock'],
      [{ title: 'x'.repeat(101) }, 'title'],
      [{ description: 'x'.repeat(2001) }, 'description'],
    ];
    for (const [override, field] of bad) {
      const { res, data } = await createProduct(tokens.alice, override);
      assert.equal(res.status, 400, JSON.stringify(override));
      assert.ok(data.errors[field], field);
    }
    const missing = await call('POST', '/products', { token: tokens.alice, body: {} });
    assert.deepEqual(Object.keys((await missing.json()).errors).sort(), ['price', 'stock', 'title']);
  });
});

describe('merchant read, update, delete', () => {
  let id;
  before(async () => {
    id = (await createProduct(tokens.bob, { title: 'Bob item' })).data.product._id;
  });

  it('lists only the caller’s own products', async () => {
    const res = await call('GET', '/products/mine', { token: tokens.bob });
    const { products } = await res.json();
    assert.ok(products.length >= 1);
    assert.ok(products.every((p) => p.title === 'Bob item'));
    assert.equal((await call('GET', '/products/mine', { token: tokens.carol })).status, 403);
  });

  it('updates an own product', async () => {
    const res = await call('PUT', `/products/${id}`, { token: tokens.bob, body: { ...PRODUCT, title: 'Renamed', stock: 0 } });
    assert.equal(res.status, 200);
    const { product } = await res.json();
    assert.equal(product.title, 'Renamed');
    assert.equal(product.stock, 0);
  });

  it('forbids changing or deleting another merchant’s product', async () => {
    const put = await call('PUT', `/products/${id}`, { token: tokens.alice, body: PRODUCT });
    assert.equal(put.status, 403);
    assert.equal((await call('DELETE', `/products/${id}`, { token: tokens.alice })).status, 403);
    assert.equal((await Product.findById(id)).title, 'Renamed');
  });

  it('cannot reassign ownership through an update', async () => {
    const aliceId = (await User.findOne({ email: 'alice@example.com' })).id;
    await call('PUT', `/products/${id}`, { token: tokens.bob, body: { ...PRODUCT, vendorId: aliceId } });
    assert.notEqual(String((await Product.findById(id)).vendorId), aliceId);
  });

  it('validates updates and handles unknown ids', async () => {
    assert.equal((await call('PUT', `/products/${id}`, { token: tokens.bob, body: { ...PRODUCT, price: -1 } })).status, 400);
    const missing = new mongoose.Types.ObjectId().toString();
    assert.equal((await call('PUT', `/products/${missing}`, { token: tokens.bob, body: PRODUCT })).status, 404);
    assert.equal((await call('DELETE', '/products/not-an-id', { token: tokens.bob })).status, 404);
  });

  it('deletes an own product', async () => {
    assert.equal((await call('DELETE', `/products/${id}`, { token: tokens.bob })).status, 200);
    assert.equal(await Product.findById(id), null);
    assert.equal((await call('GET', `/products/${id}`)).status, 404);
  });
});

describe('public catalog', () => {
  before(async () => {
    await Product.deleteMany({});
    for (let i = 1; i <= 5; i++) await createProduct(tokens.alice, { title: `Item ${i}` });
    await createProduct(tokens.alice, { title: 'Sold out', stock: 0 });
  });

  it('is public, lists only in-stock products and includes the vendor name but no email', async () => {
    const res = await call('GET', '/products');
    assert.equal(res.status, 200);
    const { products, pagination } = await res.json();
    assert.equal(pagination.total, 5);
    assert.ok(products.every((p) => p.stock > 0 && p.vendor.name === 'alice' && !('email' in p.vendor)));
    assert.equal(products[0].title, 'Item 5'); // newest first
  });

  it('paginates and clamps bad query values', async () => {
    const page2 = await (await call('GET', '/products?limit=2&page=2')).json();
    assert.deepEqual(page2.products.map((p) => p.title), ['Item 3', 'Item 2']);
    assert.equal(page2.pagination.totalPages, 3);
    const bad = await (await call('GET', '/products?limit=-4&page=abc')).json();
    assert.equal(bad.pagination.page, 1);
    assert.ok(bad.pagination.limit > 0);
    assert.equal((await (await call('GET', '/products?limit=9999')).json()).pagination.limit, 48);
  });

  it('shows product details with vendor info, including out-of-stock items', async () => {
    const soldOut = await Product.findOne({ title: 'Sold out' });
    const res = await call('GET', `/products/${soldOut.id}`);
    assert.equal(res.status, 200);
    const { product } = await res.json();
    assert.equal(product.stock, 0);
    assert.equal(product.vendor.name, 'alice');
  });

  it('returns 404 for a missing or malformed id', async () => {
    assert.equal((await call('GET', `/products/${new mongoose.Types.ObjectId()}`)).status, 404);
    assert.equal((await call('GET', '/products/mine-not')).status, 404);
  });
});
