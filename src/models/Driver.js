const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  whatsappPhone: { type: String, required: true },
  vehicleType: { type: String, enum: ['motorcycle', 'car', 'bicycle'], default: 'motorcycle' },
  zones: [{ type: String }],
  status: { type: String, enum: ['active', 'offline', 'busy'], default: 'active' },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
