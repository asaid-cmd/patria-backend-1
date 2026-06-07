const mongoose = require('mongoose');
const { DISCOUNT_TYPE } = require('../config/constants');

const couponSchema = new mongoose.Schema({
  code: { type: String, uppercase: true, unique: true, required: true },
  discountType: {
    type: String,
    enum: Object.values(DISCOUNT_TYPE),
    required: true,
  },
  discountValue: { type: Number, required: true },
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
