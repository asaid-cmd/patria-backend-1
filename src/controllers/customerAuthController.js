/**
 * Customer Mobile Auth Controller
 * Response format matches ERB exactly — flat JSON, no wrapper.
 */

const jwt      = require('jsonwebtoken');
const Customer = require('../models/Customer');

// Same token shape as ERB (role embedded for protectAny middleware)
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, { expiresIn: '30d' });

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Rate limiter — 45 sec cooldown per phone (same as ERB)
const otpLastSentMap = new Map();

/* ── helpers ─────────────────────────────────────────────── */
function userShape(c, token) {
  return {
    _id:             c._id,
    name:            c.name,
    email:           c.email || '',
    phone:           c.phone || '',
    role:            'user',
    isPhoneVerified: c.phoneVerified || false,
    loyaltyPoints:   c.loyaltyPoints || 0,
    tier:            c.tier || 'Bronze',
    permissions:     [],
    ...(token ? { token } : {}),
  };
}

/* ══════════════════════════════════════════════════════════
   REGISTER
══════════════════════════════════════════════════════════ */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'الاسم ورقم الهاتف وكلمة المرور مطلوبة' });
    }

    const exists = await Customer.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });

    if (email) {
      const emailExists = await Customer.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const otp = generateOtp();
    const customer = await Customer.create({
      name, email, phone, password,
      otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      phoneVerified: false,
    });

    // In production: send OTP via WhatsApp
    // whatsappService.sendMessage(phone, `كود التحقق: ${otp}`).catch(() => {});

    res.status(201).json({
      ...userShape(customer, generateToken(customer._id)),
      verificationCode: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return res.status(400).json({
        message: field === 'email' ? 'البريد الإلكتروني مستخدم بالفعل' : 'رقم الهاتف مستخدم بالفعل',
      });
    }
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { phone, email, password, fcmToken } = req.body;
    if (!password || (!phone && !email)) {
      return res.status(400).json({ message: 'رقم الهاتف وكلمة المرور مطلوبان' });
    }

    const customer = await Customer.findOne(phone ? { phone } : { email });
    if (!customer) return res.status(401).json({ message: 'الإيميل أو كلمة المرور غلط' });

    const valid = await customer.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'الإيميل أو كلمة المرور غلط' });

    if (fcmToken) {
      await Customer.findByIdAndUpdate(customer._id, { $addToSet: { fcmTokens: fcmToken } });
    }

    res.json(userShape(customer, generateToken(customer._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   SEND VERIFICATION OTP
══════════════════════════════════════════════════════════ */
exports.sendVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

    const customer = await Customer.findOne({ phone });
    if (!customer) return res.status(404).json({ message: 'الرقم غير مسجل' });

    const now = Date.now();
    const lastSent = otpLastSentMap.get(phone) || 0;
    if (now - lastSent < 45000) {
      return res.status(429).json({
        message: 'انتظر 45 ثانية قبل طلب كود جديد',
        secondsRemaining: Math.ceil((45000 - (now - lastSent)) / 1000),
      });
    }

    const otp = generateOtp();
    await Customer.findByIdAndUpdate(customer._id, {
      otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });
    otpLastSentMap.set(phone, now);

    // In production: send via WhatsApp
    res.json({
      message: 'تم إرسال كود التحقق',
      ...(process.env.NODE_ENV !== 'production' ? { verificationCode: otp } : {}),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   VERIFY PHONE
══════════════════════════════════════════════════════════ */
exports.verifyPhone = async (req, res) => {
  try {
    const { phone, code, fcmToken } = req.body;
    if (!phone || !code) return res.status(400).json({ message: 'الهاتف والكود مطلوبان' });

    const customer = await Customer.findOne({ phone });
    if (!customer) return res.status(404).json({ message: 'المستخدم غير موجود' });
    if (!customer.otp) return res.status(400).json({ message: 'الكود لم يُرسل بعد. طلب رمز جديد.' });
    if (customer.otp !== String(code)) return res.status(400).json({ message: 'الكود غلط' });
    if (customer.otpExpiry && new Date() > new Date(customer.otpExpiry)) {
      return res.status(400).json({ message: 'الكود منتهي الصلاحية' });
    }

    const updates = { phoneVerified: true, otp: null, otpExpiry: null };
    if (fcmToken) updates.$addToSet = { fcmTokens: fcmToken };
    const updated = await Customer.findByIdAndUpdate(customer._id, updates, { new: true });

    res.json({
      message: 'تم التحقق من الهاتف بنجاح',
      ...userShape(updated, generateToken(updated._id)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════════════════════════ */
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

    const otp = generateOtp();
    await Customer.findOneAndUpdate(
      { phone },
      { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) }
    );

    // Always return 200 (don't reveal if phone exists)
    res.json({
      message: 'تم إرسال كود إعادة الضبط',
      ...(process.env.NODE_ENV !== 'production' ? { verificationCode: otp } : {}),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   RESET PASSWORD
══════════════════════════════════════════════════════════ */
exports.resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) {
      return res.status(400).json({ message: 'رقم الهاتف والكود وكلمة المرور الجديدة مطلوبة' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) return res.status(404).json({ message: 'المستخدم غير موجود' });
    if (!customer.otp || customer.otp !== String(code)) {
      return res.status(400).json({ message: 'الكود غلط' });
    }
    if (customer.otpExpiry && new Date() > new Date(customer.otpExpiry)) {
      return res.status(400).json({ message: 'الكود منتهي الصلاحية' });
    }

    customer.password = newPassword;
    customer.otp = null;
    customer.otpExpiry = null;
    await customer.save();

    res.json({
      message: 'تم تغيير كلمة المرور بنجاح',
      token: generateToken(customer._id),
      _id: customer._id,
      name: customer.name,
      email: customer.email || '',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   OAUTH LOGIN (Google / Apple)
══════════════════════════════════════════════════════════ */
exports.oauthLogin = async (req, res) => {
  try {
    const { email, name, provider, providerId } = req.body;
    if (!email || !provider || !providerId) {
      return res.status(400).json({ message: 'email و provider و providerId مطلوبة' });
    }

    let customer = await Customer.findOne({ email });
    if (!customer) {
      customer = await Customer.create({
        name: name || email.split('@')[0],
        email, provider, googleId: providerId,
        phoneVerified: false,
      });
    }

    res.json({
      ...userShape(customer, generateToken(customer._id)),
      provider,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   CHANGE PASSWORD (authenticated)
══════════════════════════════════════════════════════════ */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'كلمة المرور الحالية والجديدة مطلوبتان' });
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const valid = await customer.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'كلمة المرور الحالية غلط' });

    customer.password = newPassword;
    await customer.save();
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePassword = exports.changePassword;

/* ══════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════ */
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id)
      .select('-password -otp -otpExpiry -fcmTokens')
      .populate('favorites', 'name price images isActive');
    if (!customer) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.json({
      _id:             customer._id,
      name:            customer.name,
      email:           customer.email || '',
      phone:           customer.phone || '',
      role:            'user',
      isPhoneVerified: customer.phoneVerified || false,
      loyaltyPoints:   customer.loyaltyPoints || 0,
      tier:            customer.tier || 'Bronze',
      addresses:       customer.addresses || [],
      favorites:       customer.favorites || [],
      orderCount:      customer.orderCount || 0,
      lifetimeValue:   customer.lifetimeValue || 0,
      lastOrderDate:   customer.lastOrderDate || null,
      isActive:        customer.isActive !== false,
      provider:        customer.provider || 'phone',
      permissions:     [],
      createdAt:       customer.createdAt,
      updatedAt:       customer.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, preferences } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, dateOfBirth, preferences },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpiry -fcmTokens');

    res.json({
      _id:           customer._id,
      name:          customer.name,
      email:         customer.email || '',
      phone:         customer.phone || '',
      role:          'user',
      loyaltyPoints: customer.loyaltyPoints || 0,
      tier:          customer.tier || 'Bronze',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   LOYALTY
══════════════════════════════════════════════════════════ */
exports.getLoyalty = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).select('loyaltyPoints tier');
    const points   = customer?.loyaltyPoints || 0;
    const tier     = customer?.tier || 'Bronze';

    const nextTierData = tier === 'Gold'
      ? { nextTier: null, pointsToNext: 0 }
      : tier === 'Silver'
        ? { nextTier: 'Gold',   pointsToNext: Math.max(0, 2000 - points) }
        : { nextTier: 'Silver', pointsToNext: Math.max(0, 500 - points) };

    res.json({
      points,
      tier,
      nextTier:       nextTierData.nextTier,
      pointsToNext:   nextTierData.pointsToNext,
      redeemableEGP:  parseFloat((points * 0.1).toFixed(2)),
      canRedeem:      points >= 50,
      minRedeemPoints: 50,
      redeemRate:     0.1,
      earnRate:       1,
      rules: {
        redeem: { pointsPerEgp: 10, egpPerPoint: 0.1, displayLabel: '10 pts = 1 EGP' },
        earn:   { egpPerPointEarned: 10, displayLabel: 'Earn 1 pt per 10 EGP spent', creditedWhen: 'order_delivered' },
        minBalanceToRedeem: 50,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loyaltyCheckoutPreview = async (req, res) => {
  try {
    const { subtotal = 0, deliveryFee = 0, couponDiscount = 0, pointsToRedeem = 0 } = req.body;
    const customer = await Customer.findById(req.user.id).select('loyaltyPoints');
    const balance  = customer?.loyaltyPoints || 0;

    const maxRedeem    = Math.min(balance, Math.ceil((subtotal - couponDiscount) / 0.1 - 1e-9));
    const applied      = Math.min(parseInt(pointsToRedeem) || 0, maxRedeem);
    const pointsDisc   = parseFloat((applied * 0.1).toFixed(2));
    const totalBefore  = subtotal + deliveryFee - couponDiscount;
    const totalAfter   = Math.max(0, totalBefore - pointsDisc);

    res.json({
      pointsBalance:                balance,
      redeemableEGP:                parseFloat((balance * 0.1).toFixed(2)),
      minRedeemPoints:              50,
      canRedeem:                    balance >= 50,
      maxPointsRedeemableThisOrder: maxRedeem,
      pointsToRedeemRequested:      parseInt(pointsToRedeem) || 0,
      pointsToRedeemApplied:        applied,
      pointsDiscountEGP:            pointsDisc,
      totals: {
        subtotal, deliveryFee, couponDiscount,
        totalBeforePoints: totalBefore,
        totalAfterPoints:  totalAfter,
      },
      pointsEarnedIfOrderCompleted: Math.floor(totalAfter / 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   FAVORITES
══════════════════════════════════════════════════════════ */
exports.getFavorites = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id)
      .populate('favorites', 'name price images isActive description');
    res.json(customer?.favorites?.filter(p => p.isActive !== false) || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const Product  = require('../models/Product');
    const product  = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

    await Customer.findByIdAndUpdate(req.user.id, { $addToSet: { favorites: product._id } });
    res.status(201).json({ message: 'تمت الإضافة للمفضلة', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.user.id, { $pull: { favorites: req.params.productId } });
    res.json({ message: 'تمت الإزالة من المفضلة' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   ADDRESSES
══════════════════════════════════════════════════════════ */
exports.getAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).select('addresses');
    res.json(customer?.addresses || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { label, zone, zoneId, lat, lng, buildingName, apartmentNo, floor, street, city, nearbyTrademark, phone, isDefault, address } = req.body;

    const customer = await Customer.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: 'المستخدم غير موجود' });

    if (isDefault) customer.addresses.forEach(a => { a.isDefault = false; });

    customer.addresses.push({ label, address, zone, zoneId, lat, lng, buildingName, apartmentNo, floor, street, city, nearbyTrademark, phone, isDefault: !!isDefault });
    await customer.save();

    res.status(201).json(customer.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const addr = customer.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: 'العنوان غير موجود' });

    Object.assign(addr, req.body);
    await customer.save();
    res.json(customer.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    customer.addresses = customer.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await customer.save();
    res.json({ message: 'تم حذف العنوان' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    customer.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.id; });
    await customer.save();
    res.json(customer.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
