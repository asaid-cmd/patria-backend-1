const mongoose = require('mongoose');

const variantOptionSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  priceAdjustment: { type: Number, default: 0 },
}, { _id: true });

const variantGroupSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  required: { type: Boolean, default: false },
  options:  [variantOptionSchema],
}, { _id: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  sku:         String,
  description: String,
  price:       { type: Number, required: true },

  // ERB uses `category`, Patria used `categoryId` — support both
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Category',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Category',
  },

  images:        [String],
  variantGroups: [variantGroupSchema],
  extras: [{
    name:  String,
    price: Number,
  }],

  lowStockThreshold: { type: Number, default: 5 },
  stockQty:          { type: Number, default: 100 },
  isActive:          { type: Boolean, default: true },
  roastLevel:        String,
  grindType:         String,
  avgRating:         { type: Number, default: 0 },
  ratingCount:       { type: Number, default: 0 },
}, { timestamps: true });

// Normalize: always sync category ↔ categoryId
productSchema.pre('save', function (next) {
  if (this.category && !this.categoryId) this.categoryId = this.category;
  if (this.categoryId && !this.category) this.category   = this.categoryId;
  next();
});

module.exports = mongoose.model('Product', productSchema);
