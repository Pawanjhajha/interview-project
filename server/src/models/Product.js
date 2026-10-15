const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    price: { type: Number, required: true, min: 0.01, max: 1000000 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000,
      validate: { validator: Number.isInteger, message: 'Stock must be a whole number' },
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Listing sorts newest first.
productSchema.index({ createdAt: -1 });

// A populated vendor is exposed as `vendor` ({ id, name }) so clients never depend on populate details.
productSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (doc.populated('vendorId')) {
      // The vendor account may have been deleted, leaving a null reference.
      ret.vendor = doc.vendorId ? { id: String(doc.vendorId._id), name: doc.vendorId.name } : null;
      ret.vendorId = doc.vendorId ? String(doc.vendorId._id) : null;
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Product', productSchema);
