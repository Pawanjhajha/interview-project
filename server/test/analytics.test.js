// Own database so this file can run in parallel with the other test files.
process.env.NODE_ENV = 'test';
const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/auth_app_test';
process.env.MONGODB_URI = TEST_URI.replace(/(\/[^/?]+)(\?|$)/, '$1_analytics$2');
process.env.JWT_SECRET ||= 'test-secret-'.repeat(4);
process.env.BCRYPT_ROUNDS = '10'; // tests only; faster hashing

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

let server;
let baseUrl;
const tokens = {};
const ids = {};

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

const sales = (token, query = '') => call('GET', `/merchant/analytics${query}`, { token });
const salesJson = async (token, query) => (await sales(token, query)).json();

const productIds = {}; // one stable id per title, so repeated titles are the same product

// Inserts an order straight into the DB so the test controls its date and status.
const insertOrder = ({ at, status = 'placed', lines }) =>
  Order.collection.insertOne({
    userId: new mongoose.Types.ObjectId(ids.buyer),
    checkoutId: crypto.randomUUID(),
    status,
    totalPrice: 1,
    createdAt: new Date(at),
    updatedAt: new Date(at),
    items: lines.map(([vendor, price, quantity, title = 'Item']) => ({
      productId: (productIds[title] ??= new mongoose.Types.ObjectId()),
      vendorId: new mongoose.Types.ObjectId(ids[vendor]),
      title,
      price,
      quantity,
    })),
  });

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Product.init(), Order.init()]);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
  tokens.alice = await register('alice', 'merchant');
  tokens.bob = await register('bob', 'merchant');
  tokens.buyer = await register('buyer');
  for (const name of ['alice', 'bob', 'buyer']) ids[name] = (await User.findOne({ email: `${name}@example.com` })).id;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('access control', () => {
  it('requires authentication and the merchant role', async () => {
    assert.equal((await sales(undefined)).status, 401);
    assert.equal((await sales(tokens.buyer)).status, 403);
  });
});

describe('sales totals', () => {
  before(async () => {
    await Order.deleteMany({});
    // One order mixes both merchants' products; only each merchant's own lines may count for them.
    await insertOrder({ at: '2026-03-10T12:00:00Z', lines: [['alice', 10.1, 3, 'Mug'], ['bob', 5, 2, 'Pen']] });
    await insertOrder({ at: '2026-03-11T12:00:00Z', lines: [['alice', 0.2, 3, 'Mug'], ['alice', 7, 1, 'Cup']] });
    await insertOrder({ at: '2026-03-10T13:00:00Z', status: 'cancelled', lines: [['alice', 100, 5]] });
  });

  const RANGE = '?from=2026-03-01&to=2026-03-31';

  it('sums only the caller’s own lines from completed orders, exact to the cent', async () => {
    const report = await salesJson(tokens.alice, RANGE);
    assert.equal(report.totalSales, 37.9); // 3 x 10.10 + 3 x 0.20 + 1 x 7.00
    assert.equal(report.itemsSold, 7);
    assert.equal(report.orderCount, 2);
    assert.deepEqual(report.topProducts.map((p) => [p.title, p.itemsSold, p.sales]), [['Mug', 6, 30.9], ['Cup', 1, 7]]);
    assert.deepEqual(report.range, { from: '2026-03-01', to: '2026-03-31' });
  });

  it('shows another merchant only their own sales, and ignores an id in the query', async () => {
    const own = await salesJson(tokens.bob, RANGE);
    assert.equal(own.totalSales, 10);
    assert.equal(own.itemsSold, 2);
    assert.equal(own.orderCount, 1);
    const spoof = await salesJson(tokens.bob, `${RANGE}&vendorId=${ids.alice}&userId=${ids.alice}`);
    assert.deepEqual({ ...spoof }, { ...own });
  });

  it('returns zeros and no products when nothing sold', async () => {
    const report = await salesJson(tokens.alice, '?from=2025-01-01&to=2025-01-31');
    assert.deepEqual([report.totalSales, report.itemsSold, report.orderCount, report.topProducts], [0, 0, 0, []]);
  });
});

describe('date boundaries', () => {
  before(async () => {
    await Order.deleteMany({});
    await insertOrder({ at: '2026-04-09T23:59:59.999Z', lines: [['alice', 1, 1, 'Before']] });
    await insertOrder({ at: '2026-04-10T00:00:00.000Z', lines: [['alice', 2, 1, 'First instant']] });
    await insertOrder({ at: '2026-04-12T23:59:59.999Z', lines: [['alice', 4, 1, 'Last instant']] });
    await insertOrder({ at: '2026-04-13T00:00:00.000Z', lines: [['alice', 8, 1, 'After']] });
  });

  it('includes the whole first and last day (UTC) and nothing outside', async () => {
    const report = await salesJson(tokens.alice, '?from=2026-04-10&to=2026-04-12');
    assert.equal(report.totalSales, 6);
    assert.deepEqual(report.topProducts.map((p) => p.title).sort(), ['First instant', 'Last instant']);
  });

  it('treats a single day as a valid range', async () => {
    assert.equal((await salesJson(tokens.alice, '?from=2026-04-13&to=2026-04-13')).totalSales, 8);
  });
});

describe('query validation', () => {
  it('rejects malformed, impossible and reversed dates', async () => {
    const bad = [
      ['?from=2026-3-1', 'from'],
      ['?from=yesterday', 'from'],
      ['?to=2026-02-31', 'to'],
      ['?from=2026-04-10&to=2026-04-09', 'from'],
      ['?from=2026-01-01&from=2026-01-02', 'from'],
      ['?from=2024-01-01&to=2026-01-01', 'to'], // longer than a year
    ];
    for (const [query, field] of bad) {
      const res = await sales(tokens.alice, query);
      assert.equal(res.status, 400, query);
      assert.ok((await res.json()).errors[field], query);
    }
  });

  it('allows exactly one year and defaults to the last 30 days', async () => {
    assert.equal((await sales(tokens.alice, '?from=2025-01-01&to=2025-12-31')).status, 200);
    const { range } = await salesJson(tokens.alice);
    const days = (new Date(range.to) - new Date(range.from)) / 86400000 + 1;
    assert.equal(days, 30);
    assert.equal(range.to, new Date().toISOString().slice(0, 10));
  });
});

describe('real checkouts feed the report', () => {
  it('counts an order placed through the checkout API against its seller', async () => {
    await Order.deleteMany({});
    const product = await Product.create({ title: 'Live', price: 12.5, stock: 5, vendorId: ids.alice });
    const res = await call('POST', '/orders/checkout', {
      token: tokens.buyer,
      body: { checkoutId: crypto.randomUUID(), items: [{ productId: String(product._id), quantity: 2 }] },
    });
    assert.equal(res.status, 201);
    const today = new Date().toISOString().slice(0, 10);
    const mine = await salesJson(tokens.alice, `?from=${today}&to=${today}`);
    assert.deepEqual([mine.totalSales, mine.itemsSold, mine.orderCount], [25, 2, 1]);
    assert.equal((await salesJson(tokens.bob, `?from=${today}&to=${today}`)).totalSales, 0);
  });
});
