const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');
const { resolveDateRange } = require('../utils/dateRange');

// The merchant is req.user; no id from the query or body is ever used.
const getSales = asyncHandler(async (req, res) => {
  const report = await analyticsService.getSalesReport(req.user.id, resolveDateRange(req.query));
  res.status(200).json({ success: true, ...report });
});

module.exports = { getSales };
