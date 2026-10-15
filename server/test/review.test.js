// Own database so this file can run in parallel with the other test files.
process.env.NODE_ENV = 'test';
const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/auth_app_test';
process.env.MONGODB_URI = TEST_URI.replace(/(\/[^/?]+)(\?|$)/, '$1_reviews$2');
process.env.JWT_SECRET ||= 'test-secret-'.repeat(4);
process.env.BCRYPT_ROUNDS = '10'; // tests only; faster hashing

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Review = require('../src/models/Review');

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
  Product.create({ title: 'Mug', price: 10, stock: 5, vendorId: ids.merchant, ...overrides });

const review = (productId, token, body) => call('POST', `/products/${productId}/reviews`, { token, body });

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Product.init(), Review.init()]);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
  tokens.merchant = await register('merchant', 'merchant');
  for (const name of ['ann', 'ben', 'cat']) tokens[name] = await register(name);
  ids.merchant = (await User.findOne({ email: 'merchant@example.com' })).id;
  ids.ann = (await User.findOne({ email: 'ann@example.com' })).id;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('creating reviews', () => {
  it('stores a review for the authenticated user and ignores a supplied userId', async () => {
    const p = await newProduct();
    const res = await review(p._id, tokens.ann, { rating: 4, comment: '  Nice  ', userId: new mongoose.Types.ObjectId().toString() });
    assert.equal(res.status, 201);
    const { review: created } = await res.json();
    assert.equal(created.rating, 4);
    assert.equal(created.comment, 'Nice');
    assert.equal(created.userId, undefined);
    assert.equal(String((await Review.findById(created._id)).userId), ids.ann);
  });

  it('accepts a rating without a comment', async () => {
    const p = await newProduct();
    const res = await review(p._id, tokens.ann, { rating: 5 });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).review.comment, '');
  });

  it('requires authentication', async () => {
    const p = await newProduct();
    assert.equal((await review(p._id, undefined, { rating: 5 })).status, 401);
    assert.equal(await Review.countDocuments({ productId: p._id }), 0);
  });

  it('rejects invalid ratings and comments with per-field errors', async () => {
    const p = await newProduct();
    const bad = [
      [{}, 'rating'],
      [{ rating: 0 }, 'rating'],
      [{ rating: 6 }, 'rating'],
      [{ rating: 2.5 }, 'rating'],
      [{ rating: '5' }, 'rating'],
      [{ rating: { $gt: 0 } }, 'rating'],
      [{ rating: 5, comment: 42 }, 'comment'],
      [{ rating: 5, comment: 'x'.repeat(1001) }, 'comment'],
    ];
    for (const [body, field] of bad) {
      const res = await review(p._id, tokens.ann, body);
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.ok((await res.json()).errors[field], field);
    }
    assert.equal(await Review.countDocuments({ productId: p._id }), 0);
  });

  it('allows only one review per user per product', async () => {
    const p = await newProduct();
    assert.equal((await review(p._id, tokens.ann, { rating: 5 })).status, 201);
    const again = await review(p._id, tokens.ann, { rating: 1 });
    assert.equal(again.status, 409);
    assert.match((await again.json()).message, /already reviewed/);
    assert.equal(await Review.countDocuments({ productId: p._id }), 1);
    assert.equal((await review(p._id, tokens.ben, { rating: 3 })).status, 201); // another user is fine
  });

  it('creates exactly one review when the same user submits in parallel', async () => {
    const p = await newProduct();
    const results = await Promise.all(Array.from({ length: 5 }, () => review(p._id, tokens.cat, { rating: 4 })));
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409, 409]);
    assert.equal(await Review.countDocuments({ productId: p._id }), 1);
  });

  it('does not let a merchant review their own product', async () => {
    const p = await newProduct();
    assert.equal((await review(p._id, tokens.merchant, { rating: 5 })).status, 403);
    assert.equal(await Review.countDocuments({ productId: p._id }), 0);
  });

  it('returns 404 for a missing or malformed product id', async () => {
    assert.equal((await review(new mongoose.Types.ObjectId(), tokens.ann, { rating: 5 })).status, 404);
    assert.equal((await review('not-an-id', tokens.ann, { rating: 5 })).status, 404);
  });
});

describe('listing reviews and ratings', () => {
  let product;
  before(async () => {
    product = await newProduct({ title: 'Rated' });
    await review(product._id, tokens.ann, { rating: 5, comment: 'Great' });
    await review(product._id, tokens.ben, { rating: 4 });
    await review(product._id, tokens.cat, { rating: 4 });
  });

  it('is public, newest first, and exposes only the reviewer name', async () => {
    const res = await call('GET', `/products/${product._id}/reviews`);
    assert.equal(res.status, 200);
    const { reviews, rating, pagination } = await res.json();
    assert.deepEqual(reviews.map((r) => r.reviewer.name), ['cat', 'ben', 'ann']);
    assert.deepEqual(Object.keys(reviews[0].reviewer), ['name']);
    assert.ok(reviews.every((r) => r.userId === undefined && !JSON.stringify(r).includes('@')));
    assert.deepEqual(rating, { average: 4.3, count: 3 }); // (5 + 4 + 4) / 3 = 4.33
    assert.equal(pagination.total, 3);
  });

  it('paginates and clamps bad query values', async () => {
    const { reviews, pagination } = await (await call('GET', `/products/${product._id}/reviews?page=2&limit=2`)).json();
    assert.equal(reviews.length, 1);
    assert.equal(pagination.totalPages, 2);
    assert.equal((await call('GET', `/products/${product._id}/reviews?page=abc&limit=-5`)).status, 200);
  });

  it('returns 404 for an unknown product', async () => {
    assert.equal((await call('GET', `/products/${new mongoose.Types.ObjectId()}/reviews`)).status, 404);
    assert.equal((await call('GET', '/products/nope/reviews')).status, 404);
  });

  it('adds rating { average, count } to product details and the catalog', async () => {
    const unrated = await newProduct({ title: 'Unrated' });
    const detail = await (await call('GET', `/products/${product._id}`)).json();
    assert.deepEqual(detail.product.rating, { average: 4.3, count: 3 });
    assert.equal(detail.product.vendor.name, 'merchant');

    const { products } = await (await call('GET', '/products?limit=48')).json();
    assert.deepEqual(products.find((p) => p._id === String(product._id)).rating, { average: 4.3, count: 3 });
    assert.deepEqual(products.find((p) => p._id === String(unrated._id)).rating, { average: 0, count: 0 });
  });

  it('keeps ratings separate between products', async () => {
    const other = await newProduct({ title: 'Other' });
    await review(other._id, tokens.ann, { rating: 1 });
    const detail = await (await call('GET', `/products/${other._id}`)).json();
    assert.deepEqual(detail.product.rating, { average: 1, count: 1 });
  });
});
