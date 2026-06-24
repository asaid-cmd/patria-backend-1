const mongoose = require('mongoose');
const { ORDER_TYPE, ORDER_STATUS, PAYMENT_METHOD, KITCHEN_STATUS, DELIVERY_STATUS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  // ERB uses `product` (populated); Patria used `productId` — support both
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:      String,
  quantity:  Number,
  price:     Number,
  image:     String,
  notes:     String,
  customization:    mongoose.Schema.Types.Mixed,
  selectedVariants: [mongoose.Schema.Types.Mixed],
  selectedExtras:   [mongoose.Schema.Types.Mixed],
  kitchenStatus: {
    type:    String,
    enum:    Object.values(KITCHEN_STATUS),
    default: KITCHEN_STATUS.PENDING,
  },
}, { _id: true });

// Auto-generate readable orderId like ORD-873206
function generateOrderId() {
  return 'ORD-' + Math.floor(100000 + Math.random() * 900000);
}

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, sparse: true },

  type: {
    type: String,
    enum: Object.values(ORDER_TYPE),
    required: true,
  },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

  customer: {
    id:      String,
    name:    String,
    phone:   String,
    email:   String,
    address: String,
    region:  { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    location: { lat: Number, lng: Number },
  },

  items: [orderItemSchema],
  notes: String,

  subtotal:    { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  tax:         { type: Number, default: 0 },
  total:       { type: Number, default: 0 },

  // Loyalty
  pointsRedeemed:       { type: Number, default: 0 },
  pointsDiscountAmount: { type: Number, default: 0 },
  estimatedPointsEarned:{ type: Number, default: 0 },
  couponCode:           String,

  // Review
  isReviewed:    { type: Boolean, default: false },
  rating:        { type: Number, default: null },
  reviewComment: { type: String, default: null },

  paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD) },

  status: {
    type:    String,
    enum:    Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  deliveryStatus: { type: String, enum: Object.values(DELIVERY_STATUS) },

  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driverLocation: { lat: Number, lng: Number, updatedAt: Date },
  customerLocation: { lat: Number, lng: Number },

  staffId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  shiftId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
}, { timestamps: true });

// Auto-generate orderId before saving
orderSchema.pre('save', function (next) {
  if (!this.orderId) this.orderId = generateOrderId();
  // Sync product ↔ productId in items
  for (const item of this.items) {
    if (item.product && !item.productId) item.productId = item.product;
    if (item.productId && !item.product) item.product   = item.productId;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
