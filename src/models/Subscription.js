const mongoose = require('mongoose');
const { SUBSCRIPTION_FREQUENCY, SUBSCRIPTION_STATUS, PAYMENT_STATUS } = require('../config/constants');

const subscriptionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true },
  frequency: {
    type: String,
    enum: Object.values(SUBSCRIPTION_FREQUENCY),
    required: true,
  },
  nextDeliveryDate: { type: Date, required: true },
  lastDeliveryDate: Date,
  status: {
    type: String,
    enum: Object.values(SUBSCRIPTION_STATUS),
    default: SUBSCRIPTION_STATUS.ACTIVE,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },
  totalPrice: Number,
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
