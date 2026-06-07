const mongoose = require('mongoose');
const { SHIFT_STATUS } = require('../config/constants');

const shiftSchema = new mongoose.Schema({
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  openedAt: { type: Date, default: Date.now },
  closedAt: Date,
  openingBalance: Number,
  closingBalance: Number,
  totalRevenue: { type: Number, default: 0 },
  cashTotal: { type: Number, default: 0 },
  cardTotal: { type: Number, default: 0 },
  mixTotal: { type: Number, default: 0 },
  orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  status: {
    type: String,
    enum: Object.values(SHIFT_STATUS),
    default: SHIFT_STATUS.OPEN,
  },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
