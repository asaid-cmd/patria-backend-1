const mongoose = require('mongoose');
const { DISCOUNT_TYPE, OFFER_STATUS } = require('../config/constants');

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  discountType: {
    type: String,
    enum: Object.values(DISCOUNT_TYPE),
    required: true,
  },
  discountValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  bannerImage: String,
  status: {
    type: String,
    enum: Object.values(OFFER_STATUS),
    default: OFFER_STATUS.ACTIVE,
  },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
