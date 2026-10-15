const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const productService = require('./product.service');
const ratingService = require('./rating.service');

// The reviewer is always the authenticated user; a userId in the body is never read.
const create = async (productId, userId, { rating, comment = '' }) => {
  const product = await productService.findOrFail(productId);
  if (product.vendorId.equals(userId)) throw new AppError('You cannot review your own product', 403);

  try {
    return await Review.create({ productId: product._id, userId, rating, comment: comment.trim() });
  } catch (error) {
    if (error.code === 11000) throw new AppError('You have already reviewed this product', 409);
    throw error;
  }
};

const listForProduct = async (productId, { page, limit }) => {
  const product = await productService.findOrFail(productId);
  const filter = { productId: product._id };
  const [reviews, total, summaries] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name'),
    Review.countDocuments(filter),
    ratingService.summarize([product._id]),
  ]);
  return {
    reviews,
    rating: summaries.get(String(product._id)) ?? ratingService.NO_RATING,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = { create, listForProduct };
