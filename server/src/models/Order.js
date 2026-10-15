const mongoose = require('mongoose');

const { ORDER_STATUSES } = require('../utils/orderStatus');

// A line keeps the title and unit price as they were at purchase time, so later product edits
// or deletions never change what an order says.
const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of the seller so sales reports need no join and survive product deletion.
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Client-generated per checkout attempt; the unique index below makes a retried request
    // return the existing order instead of deducting stock twice.
    checkoutId: { type: String, required: true },
    items: {
      type: [itemSchema],
      validate: { validator: (items) => items.length > 0, message: 'An order needs at least one item' },
    },
    totalPrice: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
  },
  { timestamps: true } // createdAt is the order date
);

orderSchema.index({ userId: 1, checkoutId: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
// Merchant sales reports filter by seller and date.
orderSchema.index({ 'items.vendorId': 1, createdAt: -1 });

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Order', orderSchema);
