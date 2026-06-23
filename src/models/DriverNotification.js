const mongoose = require('mongoose');

const driverNotificationSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_assigned',
        'order_cancelled',
        'shift_reminder',
        'shift_end',
        'overtime_approved',
        'overtime_denied',
        'system',
      ],
      default: 'order_assigned',
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

driverNotificationSchema.index({ driverId: 1, createdAt: -1 });

module.exports = mongoose.model('DriverNotification', driverNotificationSchema);
