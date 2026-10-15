const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

// Money is summed in whole cents so floating point never drifts.
const totalOf = (lines) => lines.reduce((cents, { price, quantity }) => cents + Math.round(price * 100) * quantity, 0) / 100;

// Condition and decrement are one atomic step, so concurrent checkouts can never oversell, and the
// returned document carries the price at the moment the units were taken.
const takeStock = (productId, quantity, buyerId) =>
  Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity }, vendorId: { $ne: buyerId } },
    { $inc: { stock: -quantity } },
    { returnDocument: 'after' }
  );

const explainFailure = async (productId, buyerId) => {
  const product = await Product.findById(productId);
  if (!product) return new AppError('A product in your cart is no longer available', 404);
  if (product.vendorId.equals(buyerId)) return new AppError('You cannot buy your own product', 400);
  const left = product.stock === 0 ? 'is out of stock' : `has only ${product.stock} left`;
  return new AppError(`"${product.title}" ${left}`, 409);
};

// Puts back what was already taken. Best effort: a failure here is logged, never hides the real error.
const restoreStock = async (taken) => {
  const results = await Promise.allSettled(
    taken.map(({ productId, quantity }) => Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }))
  );
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Stock restore failed:', r.reason));
};

/**
 * Creates an order from [{ productId, quantity }]. Standalone MongoDB has no transactions, so
 * stock is taken line by line and given back if any line or the order insert fails.
 * Returns { order, created }; created is false when this checkoutId was already completed.
 */
const checkout = async (userId, { checkoutId, items }) => {
  const existing = await Order.findOne({ userId, checkoutId });
  if (existing) return { order: existing, created: false };

  const taken = [];
  try {
    for (const { productId, quantity } of items) {
      const product = await takeStock(productId, quantity, userId);
      if (!product) throw await explainFailure(productId, userId);
      taken.push({ productId: product._id, vendorId: product.vendorId, title: product.title, price: product.price, quantity });
    }
    const order = await Order.create({ userId, checkoutId, items: taken, totalPrice: totalOf(taken) });
    return { order, created: true };
  } catch (error) {
    await restoreStock(taken);
    // Two identical requests raced: the other one won, so hand back its order.
    const winner = error.code === 11000 && (await Order.findOne({ userId, checkoutId }));
    if (winner) return { order: winner, created: false };
    throw error;
  }
};

const listForUser = async (userId, { page, limit }) => {
  const filter = { userId };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { checkout, listForUser };
