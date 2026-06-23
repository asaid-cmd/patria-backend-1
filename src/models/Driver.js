const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverNotificationSchema = new mongoose.Schema({
  title: String,
  message: { type: String, required: true },
  type: { type: String, default: 'general' },
  isRead: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  password: String,
  whatsappPhone: { type: String, unique: true, sparse: true },
  vehicleType: { type: String, enum: ['motorcycle', 'car', 'bicycle'], default: 'motorcycle' },
  zones: [{ type: String }],
  status: { type: String, enum: ['active', 'offline', 'busy'], default: 'offline' },
  isOnShift: { type: Boolean, default: false },
  shiftStartedAt: Date,
  shiftDeliveriesCount: { type: Number, default: 0 },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    updatedAt: Date,
  },
  fcmTokens: [{ type: String }],
  notifications: [driverNotificationSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

driverSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

driverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Driver', driverSchema);
