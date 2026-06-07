const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  phone: String,
  email: String,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deliveryFee: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
