const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CUSTOMER_TIER } = require('../config/constants');

const addressSchema = new mongoose.Schema({
  label:           { type: String, default: 'Home' },
  address:         { type: String },
  area:            { type: String }, // ERB compat alias for zone/district name
  zone:            { type: String },
  zoneId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', default: null },
  lat:             Number,
  lng:             Number,
  buildingName:    { type: String },
  apartmentNo:     { type: String },
  floor:           { type: String },
  street:          { type: String },
  city:            { type: String },
  nearbyTrademark: { type: String },
  phone:           { type: String },
  isDefault:       { type: Boolean, default: false },
}, { _id: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: { type: String, unique: true, sparse: true },
  password: String,
  googleId: String,
  phoneVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
  tier: {
    type: String,
    enum: Object.values(CUSTOMER_TIER),
    default: CUSTOMER_TIER.BRONZE,
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalLTV: { type: Number, default: 0 },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  addresses: [addressSchema],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  fcmTokens:     [{ type: String }],
  isActive:      { type: Boolean, default: true },
  provider:      { type: String, enum: ['phone', 'google', 'apple'], default: 'phone' },
  orderCount:    { type: Number, default: 0 },
  lifetimeValue: { type: Number, default: 0 },
  lastOrderDate: { type: Date, default: null },
  dateOfBirth:   { type: Date },
  preferences: {
    favoriteRoast:  { type: String },
    favoriteGrind:  { type: String },
    language:       { type: String, default: 'ar' },
    notifications:  { type: Boolean, default: true },
  },
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

customerSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('Customer', customerSchema);
