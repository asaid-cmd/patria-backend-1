const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  customerName: String,
  customerPhone: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  orderType: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  categories: [{ type: String }],
  isVisible: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
