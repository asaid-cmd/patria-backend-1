const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_confirmed',
        'order_preparing',
        'order_on_way',
        'order_delivered',
        'order_cancelled',
        'delivery_assigned',
        'delivery_picking',
        'delivery_picked',
        'delivery_near',
        'delivery_failed',
        'promo',
      ],
      default: 'order_placed',
    },
    title:    { type: String, required: true },
    body:     { type: String, required: true },
    orderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderRef: { type: String, default: null },
    data:     { type: mongoose.Schema.Types.Mixed, default: {} },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

userNotificationSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
