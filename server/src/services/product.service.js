const mongoose = require('mongoose');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const ratingService = require('./rating.service');

const VENDOR_FIELDS = 'name';

// Only these fields are ever written, so vendorId or other body fields are ignored.
const pickEditable = ({ title, price, stock, description = '' }) => ({
  title: title.trim(),
  price,
  stock,
  description: description.trim(),
});

const findOrFail = async (id) => {
  const product = mongoose.isValidObjectId(id) ? await Product.findById(id) : null;
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

// Ownership is decided here from the authenticated user's id, never from client input.
const findOwned = async (id, vendorId) => {
  const product = await findOrFail(id);
  if (!product.vendorId.equals(vendorId)) throw new AppError('You can only manage your own products', 403);
  return product;
};

const create = (vendorId, data) => Product.create({ ...pickEditable(data), vendorId });

const listByVendor = (vendorId) => Product.find({ vendorId }).sort({ createdAt: -1 });

const update = async (id, vendorId, data) => {
  const product = await findOwned(id, vendorId);
  product.set(pickEditable(data));
  return product.save();
};

const remove = async (id, vendorId) => {
  const product = await findOwned(id, vendorId);
  await product.deleteOne();
};

// Public catalog lists only products that can be bought.
const listAvailable = async ({ page, limit }) => {
  const filter = { stock: { $gt: 0 } };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('vendorId', VENDOR_FIELDS),
    Product.countDocuments(filter),
  ]);
  return { products: await ratingService.withRatings(products), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getPublic = async (id) => {
  const product = await findOrFail(id);
  await product.populate('vendorId', VENDOR_FIELDS);
  return (await ratingService.withRatings([product]))[0];
};

module.exports = { findOrFail, create, listByVendor, update, remove, listAvailable, getPublic };
