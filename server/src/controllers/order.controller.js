const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const parsePagination = require('../utils/parsePagination');

const checkout = asyncHandler(async (req, res) => {
  const { order, created } = await orderService.checkout(req.user.id, req.body);
  res.status(created ? 201 : 200).json({ success: true, order });
});

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listForUser(req.user.id, parsePagination(req.query));
  res.status(200).json({ success: true, ...result });
});

module.exports = { checkout, list };
