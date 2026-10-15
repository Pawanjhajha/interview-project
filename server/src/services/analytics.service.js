const mongoose = require('mongoose');
const Order = require('../models/Order');
const { COMPLETED_STATUS } = require('../utils/orderStatus');
const { DAY_MS, toDayString } = require('../utils/dateRange');

const TOP_PRODUCTS = 10;

// Sales for ONE merchant: only order lines whose seller is `vendorId` are counted, and the vendor is
// always the authenticated user. `from`/`to` are inclusive UTC days, so the query runs to the start of
// the day after `to` (exclusive), which keeps 23:59:59.999 on the last day inside the range.
// Money is summed in whole cents so floating point cannot drift.
const getSalesReport = async (vendorId, { from, to }) => {
  const vendor = new mongoose.Types.ObjectId(vendorId);
  const end = new Date(to.getTime() + DAY_MS);

  const [report] = await Order.aggregate([
    { $match: { status: COMPLETED_STATUS, createdAt: { $gte: from, $lt: end }, 'items.vendorId': vendor } },
    { $unwind: '$items' },
    { $match: { 'items.vendorId': vendor } },
    {
      $project: {
        productId: '$items.productId',
        title: '$items.title',
        quantity: '$items.quantity',
        cents: { $multiply: [{ $round: [{ $multiply: ['$items.price', 100] }, 0] }, '$items.quantity'] },
      },
    },
    {
      $facet: {
        totals: [
          { $group: { _id: '$_id', cents: { $sum: '$cents' }, itemsSold: { $sum: '$quantity' } } },
          { $group: { _id: null, cents: { $sum: '$cents' }, itemsSold: { $sum: '$itemsSold' }, orders: { $sum: 1 } } },
        ],
        topProducts: [
          { $group: { _id: '$productId', title: { $last: '$title' }, itemsSold: { $sum: '$quantity' }, cents: { $sum: '$cents' } } },
          { $sort: { cents: -1, _id: 1 } },
          { $limit: TOP_PRODUCTS },
        ],
      },
    },
  ]);

  const [totals = { cents: 0, itemsSold: 0, orders: 0 }] = report.totals;
  return {
    range: { from: toDayString(from), to: toDayString(to) },
    totalSales: totals.cents / 100,
    itemsSold: totals.itemsSold,
    orderCount: totals.orders,
    topProducts: report.topProducts.map(({ _id, title, itemsSold, cents }) => ({
      productId: String(_id),
      title,
      itemsSold,
      sales: cents / 100,
    })),
  };
};

module.exports = { getSalesReport };
