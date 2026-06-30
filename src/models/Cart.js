const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  image: String,
  quantity: { type: Number, default: 1, min: 1 },
  customization: mongoose.Schema.Types.Mixed,
  selectedVariants: [mongoose.Schema.Types.Mixed],
  selectedExtras: [mongoose.Schema.Types.Mixed],
  notes: String,
  specialRequests: String,
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
