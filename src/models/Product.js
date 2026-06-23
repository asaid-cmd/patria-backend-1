const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: String,
  price: { type: Number, required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  images: [String],
  extras: [{
    name: String,
    price: Number,
  }],
  lowStockThreshold: { type: Number, default: 5 },
  stockQty: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  roastLevel: String,
  grindType: String,
  description: String,
  avgRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
