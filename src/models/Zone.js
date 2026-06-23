const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: String,
  deliveryFee: { type: Number, default: 0 },
  minOrder: { type: Number, default: 0 },
  estimatedMinutes: { type: Number, default: 45 },
  isActive: { type: Boolean, default: true },
  polygon: [[Number]],
}, { timestamps: true });

module.exports = mongoose.model('Zone', zoneSchema);
