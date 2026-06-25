const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  cardType:       { type: String, enum: ['Visa', 'Mastercard', 'Meeza', 'Other'], required: true },
  last4:          { type: String, required: true },
  cardholderName: { type: String, required: true },
  expiryMonth:    { type: String, required: true },
  expiryYear:     { type: String, required: true },
  isDefault:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
