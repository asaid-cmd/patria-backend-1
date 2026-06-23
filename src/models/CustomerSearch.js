const mongoose = require('mongoose');

const customerSearchSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  query: { type: String, required: true },
  count: { type: Number, default: 1 },
}, { timestamps: true });

customerSearchSchema.index({ customerId: 1, createdAt: -1 });
customerSearchSchema.index({ query: 1 });

module.exports = mongoose.model('CustomerSearch', customerSearchSchema);
