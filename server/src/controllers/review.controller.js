const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');
const parsePagination = require('../utils/parsePagination');

const list = asyncHandler(async (req, res) => {
  const result = await reviewService.listForProduct(req.params.id, parsePagination(req.query));
  res.status(200).json({ success: true, ...result });
});

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.create(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, review });
});

module.exports = { list, create };
