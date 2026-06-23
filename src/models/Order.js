const mongoose = require('mongoose');
const { ORDER_TYPE, ORDER_STATUS, PAYMENT_METHOD, KITCHEN_STATUS, DELIVERY_STATUS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: String,
  quantity: Number,
  price: Number,
  notes: String,
  customization: mongoose.Schema.Types.Mixed,
  selectedVariants: [mongoose.Schema.Types.Mixed],
  selectedExtras: [mongoose.Schema.Types.Mixed],
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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  customer: {
    name: String,
    phone: String,
    address: String,
    region: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    location: {
      lat: Number,
      lng: Number,
    },
  },
  items: [orderItemSchema],
  notes: String,
  subtotal: Number,
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
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
  deliveryStatus: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  driverLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  customerLocation: {
    lat: Number,
    lng: Number,
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
  couponCode: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
