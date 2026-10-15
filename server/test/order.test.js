// Own database so this file can run in parallel with the other test files.
process.env.NODE_ENV = 'test';
const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/auth_app_test';
process.env.MONGODB_URI = TEST_URI.replace(/(\/[^/?]+)(\?|$)/, '$1_orders$2');
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

const newProduct = (overrides = {}) =>
  Product.create({ title: 'Mug', price: 10.1, stock: 5, vendorId: ids.merchant, ...overrides });

const checkout = (token, items, extra = {}) =>
  call('POST', '/orders/checkout', { token, body: { checkoutId: crypto.randomUUID(), items, ...extra } });

const line = (product, quantity) => ({ productId: String(product._id), quantity });
const stockOf = async (product) => (await Product.findById(product._id)).stock;

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Product.init(), Order.init()]);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
  tokens.merchant = await register('merchant', 'merchant');
  tokens.buyer = await register('buyer');
  tokens.other = await register('other');
  ids.merchant = (await User.findOne({ email: 'merchant@example.com' })).id;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('checkout success', () => {
  it('computes prices on the server, deducts stock and ignores client prices and totals', async () => {
    const a = await newProduct({ price: 10.1, stock: 5 });
    const b = await newProduct({ title: 'Plate', price: 0.2, stock: 10 });
    const res = await checkout(
      tokens.buyer,
      [{ ...line(a, 3), price: 0.01 }, { ...line(b, 3), price: 0.01 }],
      { totalPrice: 0.01, status: 'cancelled', userId: new mongoose.Types.ObjectId().toString() }
    );
    assert.equal(res.status, 201);
    const { order } = await res.json();
    assert.equal(order.totalPrice, 30.9); // 3 x 10.10 + 3 x 0.20, exact to the cent
    assert.equal(order.status, 'placed');
    assert.equal(order.userId, (await User.findOne({ email: 'buyer@example.com' })).id);
    assert.deepEqual(order.items.map((i) => [i.title, i.price, i.quantity]), [['Mug', 10.1, 3], ['Plate', 0.2, 3]]);
    assert.equal(await stockOf(a), 2);
    assert.equal(await stockOf(b), 7);
  });

  it('keeps the purchase-time price when the product price changes later', async () => {
    const p = await newProduct({ price: 20 });
    const { order } = await (await checkout(tokens.buyer, [line(p, 1)])).json();
    await Product.updateOne({ _id: p._id }, { price: 99 });
    const { orders } = await (await call('GET', '/orders', { token: tokens.buyer })).json();
    assert.equal(orders.find((o) => o._id === order._id).items[0].price, 20);
  });

  it('can buy the last unit', async () => {
    const p = await newProduct({ stock: 2 });
    assert.equal((await checkout(tokens.buyer, [line(p, 2)])).status, 201);
    assert.equal(await stockOf(p), 0);
  });
});

describe('checkout rejections', () => {
  it('requires authentication', async () => {
    const p = await newProduct();
    assert.equal((await checkout(undefined, [line(p, 1)])).status, 401);
    assert.equal(await stockOf(p), 5);
  });

  it('rejects invalid carts with per-field errors and changes nothing', async () => {
    const p = await newProduct();
    const bad = [
      [[], 'items'],
      [[line(p, 0)], 'items.0.quantity'],
      [[line(p, -1)], 'items.0.quantity'],
      [[line(p, 1.5)], 'items.0.quantity'],
      [[{ productId: String(p._id), quantity: '2' }], 'items.0.quantity'],
      [[line(p, 100)], 'items.0.quantity'],
      [[{ productId: 'nope', quantity: 1 }], 'items.0.productId'],
      [[{ productId: { $gt: '' }, quantity: 1 }], 'items.0.productId'],
      [[line(p, 1), line(p, 1)], 'items'],
    ];
    for (const [items, field] of bad) {
      const res = await checkout(tokens.buyer, items);
      assert.equal(res.status, 400, JSON.stringify(items));
      assert.ok((await res.json()).errors[field], field);
    }
    const noItems = await call('POST', '/orders/checkout', { token: tokens.buyer, body: { checkoutId: 'short' } });
    const { errors } = await noItems.json();
    assert.ok(errors.checkoutId && errors.items);
    assert.equal(await stockOf(p), 5);
  });

  it('refuses more than the available stock', async () => {
    const p = await newProduct({ stock: 2 });
    const res = await checkout(tokens.buyer, [line(p, 3)]);
    assert.equal(res.status, 409);
    assert.match((await res.json()).message, /only 2 left/);
    assert.equal(await stockOf(p), 2);
  });

  it('rolls back earlier lines when a later line fails', async () => {
    const ok = await newProduct({ stock: 5 });
    const short = await newProduct({ stock: 1 });
    const gone = new mongoose.Types.ObjectId().toString();
    const before = await Order.countDocuments();

    assert.equal((await checkout(tokens.buyer, [line(ok, 2), line(short, 2)])).status, 409);
    assert.equal((await checkout(tokens.buyer, [line(ok, 2), { productId: gone, quantity: 1 }])).status, 404);
    assert.equal(await stockOf(ok), 5);
    assert.equal(await stockOf(short), 1);
    assert.equal(await Order.countDocuments(), before);
  });

  it('does not let a merchant buy their own product', async () => {
    const p = await newProduct();
    const res = await checkout(tokens.merchant, [line(p, 1)]);
    assert.equal(res.status, 400);
    assert.equal(await stockOf(p), 5);
  });
});

describe('duplicate and concurrent checkouts', () => {
  it('returns the same order for a repeated checkoutId and deducts stock once', async () => {
    const p = await newProduct({ stock: 5 });
    const checkoutId = crypto.randomUUID();
    const first = await checkout(tokens.buyer, [line(p, 2)], { checkoutId });
    const second = await checkout(tokens.buyer, [line(p, 2)], { checkoutId });
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal((await second.json()).order._id, (await first.json()).order._id);
    assert.equal(await stockOf(p), 3);
  });

  it('creates one order and one deduction when the same request arrives in parallel', async () => {
    const p = await newProduct({ stock: 10 });
    const checkoutId = crypto.randomUUID();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => checkout(tokens.buyer, [line(p, 2)], { checkoutId }))
    );
    const orders = await Promise.all(results.map(async (r) => (await r.json()).order._id));
    assert.equal(new Set(orders).size, 1);
    assert.equal(await Order.countDocuments({ checkoutId }), 1);
    assert.equal(await stockOf(p), 8);
  });

  it('never oversells the last unit to two buyers', async () => {
    const p = await newProduct({ stock: 1 });
    const results = await Promise.all([checkout(tokens.buyer, [line(p, 1)]), checkout(tokens.other, [line(p, 1)])]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await stockOf(p), 0);
  });
});

describe('order history', () => {
  it('requires authentication and lists only the caller’s orders, newest first', async () => {
    assert.equal((await call('GET', '/orders')).status, 401);
    const p = await newProduct({ stock: 5 });
    await checkout(tokens.other, [line(p, 1)]);
    await checkout(tokens.other, [line(p, 2)]);

    const { orders, pagination } = await (await call('GET', '/orders', { token: tokens.other })).json();
    assert.equal(orders.length, 2);
    assert.equal(pagination.total, 2);
    assert.equal(orders[0].items[0].quantity, 2);
    const otherId = (await User.findOne({ email: 'other@example.com' })).id;
    assert.ok(orders.every((o) => o.userId === otherId));
  });
});
