const mongoose = require('mongoose');
const { ORDER_TYPE, ORDER_STATUS, PAYMENT_METHOD, KITCHEN_STATUS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  quantity: Number,
  price: Number,
  notes: String,
  kitchenStatus: {
    type: String,
    enum: Object.values(KITCHEN_STATUS),
    default: KITCHEN_STATUS.PENDING,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(ORDER_TYPE),
    required: true,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
  },
  items: [orderItemSchema],
  notes: String,
  subtotal: Number,
  tax: Number,
  total: Number,
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
