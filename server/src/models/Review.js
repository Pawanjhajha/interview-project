const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'Rating must be a whole number' },
    },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// The index is what guarantees one review per user per product, even under concurrent requests.
// It also serves rating aggregation and review listing, which both start from productId.
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

// Only the reviewer's name is public; the user id and email never leave the server.
reviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (doc.populated('userId')) ret.reviewer = doc.userId ? { name: doc.userId.name } : null;
    delete ret.userId;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Review', reviewSchema);
