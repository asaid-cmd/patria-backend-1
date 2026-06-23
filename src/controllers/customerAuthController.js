const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const generateCustomerToken = (customerId) => {
  return jwt.sign(
    { id: customerId, role: 'customer' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !phone || !password) {
      return sendError(res, 'name, phone and password are required', 400);
    }

    const exists = await Customer.findOne({ phone });
    if (exists) return sendError(res, 'Phone already registered', 409);

    const customer = await Customer.create({ name, email, phone, password });
    const token = generateCustomerToken(customer._id);

    sendSuccess(res, { customer: customer.toJSON(), token }, 'Registered successfully', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return sendError(res, 'phone and password are required', 400);

    const customer = await Customer.findOne({ phone });
    if (!customer) return sendError(res, 'Invalid credentials', 401);

    const valid = await customer.comparePassword(password);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    const token = generateCustomerToken(customer._id);
    sendSuccess(res, { customer: customer.toJSON(), token }, 'Login successful');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.sendVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return sendError(res, 'phone is required', 400);

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Customer.findOneAndUpdate(
      { phone },
      { otp, otpExpiry },
      { upsert: false }
    );

    // In production: send OTP via SMS
    sendSuccess(res, { otp }, 'Verification code sent');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.verifyPhone = async (req, res) => {
  try {
    const { phone, code, fcmToken } = req.body;
    if (!phone || !code) return sendError(res, 'phone and code are required', 400);

    const customer = await Customer.findOne({ phone });
    if (!customer) return sendError(res, 'Customer not found', 404);

    if (customer.otp !== code || !customer.otpExpiry || customer.otpExpiry < new Date()) {
      return sendError(res, 'Invalid or expired code', 400);
    }

    const update = { phoneVerified: true, otp: null, otpExpiry: null };
    if (fcmToken && !customer.fcmTokens.includes(fcmToken)) {
      update.$push = { fcmTokens: fcmToken };
    }

    await Customer.findByIdAndUpdate(customer._id, update);

    const token = generateCustomerToken(customer._id);
    sendSuccess(res, { token }, 'Phone verified');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return sendError(res, 'phone is required', 400);

    const customer = await Customer.findOne({ phone });
    if (!customer) return sendSuccess(res, null, 'If phone exists, OTP sent');

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await Customer.findByIdAndUpdate(customer._id, { otp, otpExpiry });

    // In production: send OTP via SMS
    sendSuccess(res, { otp }, 'If phone exists, OTP sent');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) {
      return sendError(res, 'phone, code and newPassword are required', 400);
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) return sendError(res, 'Customer not found', 404);

    if (customer.otp !== code || !customer.otpExpiry || customer.otpExpiry < new Date()) {
      return sendError(res, 'Invalid or expired code', 400);
    }

    customer.password = newPassword;
    customer.otp = null;
    customer.otpExpiry = null;
    await customer.save();

    sendSuccess(res, null, 'Password reset successful');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.oauthLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return sendError(res, 'idToken is required', 400);

    // In production: verify idToken with Google
    // For now return an error instructing proper Google verification setup
    sendError(res, 'Google OAuth not configured. Set up firebase-admin to verify idToken.', 501);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'currentPassword and newPassword are required', 400);
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) return sendError(res, 'Customer not found', 404);

    const valid = await customer.comparePassword(currentPassword);
    if (!valid) return sendError(res, 'Current password is incorrect', 400);

    customer.password = newPassword;
    await customer.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).populate('favorites');
    if (!customer) return sendError(res, 'Customer not found', 404);
    sendSuccess(res, { customer: customer.toJSON() });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    );
    sendSuccess(res, { customer: customer.toJSON() }, 'Profile updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'currentPassword and newPassword are required', 400);
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) return sendError(res, 'Customer not found', 404);

    const valid = await customer.comparePassword(currentPassword);
    if (!valid) return sendError(res, 'Current password is incorrect', 400);

    customer.password = newPassword;
    await customer.save();

    sendSuccess(res, null, 'Password updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getLoyalty = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id, 'loyaltyPoints tier totalLTV');
    if (!customer) return sendError(res, 'Customer not found', 404);

    const tierThresholds = { bronze: 0, silver: 500, gold: 1500 };
    const nextTier = customer.tier === 'bronze' ? 'silver' : customer.tier === 'silver' ? 'gold' : null;
    const pointsToNext = nextTier ? tierThresholds[nextTier] - customer.loyaltyPoints : 0;

    sendSuccess(res, {
      loyaltyPoints: customer.loyaltyPoints,
      tier: customer.tier,
      totalLTV: customer.totalLTV,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNext),
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.loyaltyCheckoutPreview = async (req, res) => {
  try {
    const { pointsToRedeem, orderTotal } = req.body;
    if (!pointsToRedeem || !orderTotal) {
      return sendError(res, 'pointsToRedeem and orderTotal are required', 400);
    }

    const customer = await Customer.findById(req.user.id, 'loyaltyPoints');
    if (!customer) return sendError(res, 'Customer not found', 404);

    const redeemable = Math.min(pointsToRedeem, customer.loyaltyPoints);
    const discountPerPoint = 0.1;
    const discount = redeemable * discountPerPoint;
    const newTotal = Math.max(0, orderTotal - discount);

    sendSuccess(res, {
      pointsToRedeem: redeemable,
      discount,
      newTotal,
      remainingPoints: customer.loyaltyPoints - redeemable,
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).populate('favorites');
    if (!customer) return sendError(res, 'Customer not found', 404);
    sendSuccess(res, { favorites: customer.favorites });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    await Customer.findByIdAndUpdate(req.user.id, { $addToSet: { favorites: productId } });
    sendSuccess(res, null, 'Added to favorites');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    await Customer.findByIdAndUpdate(req.user.id, { $pull: { favorites: productId } });
    sendSuccess(res, null, 'Removed from favorites');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id, 'addresses');
    if (!customer) return sendError(res, 'Customer not found', 404);
    sendSuccess(res, { addresses: customer.addresses });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { label, address, lat, lng, isDefault } = req.body;
    if (!address) return sendError(res, 'address is required', 400);

    const customer = await Customer.findById(req.user.id);
    if (!customer) return sendError(res, 'Customer not found', 404);

    if (isDefault) {
      customer.addresses.forEach(a => { a.isDefault = false; });
    }

    customer.addresses.push({ label, address, lat, lng, isDefault: !!isDefault });
    await customer.save();

    sendSuccess(res, { addresses: customer.addresses }, 'Address added', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, lat, lng, isDefault } = req.body;

    const customer = await Customer.findById(req.user.id);
    if (!customer) return sendError(res, 'Customer not found', 404);

    const addr = customer.addresses.id(addressId);
    if (!addr) return sendError(res, 'Address not found', 404);

    if (isDefault) {
      customer.addresses.forEach(a => { a.isDefault = false; });
    }

    if (label !== undefined) addr.label = label;
    if (address !== undefined) addr.address = address;
    if (lat !== undefined) addr.lat = lat;
    if (lng !== undefined) addr.lng = lng;
    if (isDefault !== undefined) addr.isDefault = isDefault;

    await customer.save();
    sendSuccess(res, { addresses: customer.addresses }, 'Address updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const customer = await Customer.findById(req.user.id);
    if (!customer) return sendError(res, 'Customer not found', 404);

    customer.addresses = customer.addresses.filter(a => a._id.toString() !== addressId);
    await customer.save();

    sendSuccess(res, { addresses: customer.addresses }, 'Address deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(req.user.id);
    if (!customer) return sendError(res, 'Customer not found', 404);

    const addr = customer.addresses.id(id);
    if (!addr) return sendError(res, 'Address not found', 404);

    customer.addresses.forEach(a => { a.isDefault = false; });
    addr.isDefault = true;
    await customer.save();

    sendSuccess(res, { addresses: customer.addresses }, 'Default address set');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
