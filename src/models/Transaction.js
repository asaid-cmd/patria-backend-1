const mongoose = require('mongoose');
const { TRANSACTION_TYPE, EXPENSE_CATEGORY, PAYMENT_STATUS } = require('../config/constants');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: true,
  },
  statement: { type: String, required: true },
  category: String,
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  isSalary: { type: Boolean, default: false },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.COMPLETED,
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
