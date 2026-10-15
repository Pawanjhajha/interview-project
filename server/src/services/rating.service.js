const mongoose = require('mongoose');
const Review = require('../models/Review');

const NO_RATING = { average: 0, count: 0 };
const roundToTenth = (value) => Math.round(value * 10) / 10;

// Map of productId (string) -> { average, count } computed by one aggregation, so a list of
// products costs one query and the numbers can never drift from the reviews themselves.
const summarize = async (productIds) => {
  const rows = await Review.aggregate([
    { $match: { productId: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), { average: roundToTenth(row.average), count: row.count }]));
};

const withRatings = async (products) => {
  const summaries = await summarize(products.map((product) => product._id));
  return products.map((product) => ({ ...product.toJSON(), rating: summaries.get(String(product._id)) ?? NO_RATING }));
};

module.exports = { NO_RATING, summarize, withRatings };
