const mongoose = require('mongoose');
const { CUSTOMER_TIER } = require('../config/constants');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  tier: {
    type: String,
    enum: Object.values(CUSTOMER_TIER),
    default: CUSTOMER_TIER.BRONZE,
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalLTV: { type: Number, default: 0 },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
