const Offer = require('../models/Offer');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getOffers = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const offers = await Offer.find().populate('productIds').skip(skip).limit(limit);
    const total = await Offer.countDocuments();
    sendSuccess(res, paginatedResult(offers, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createOffer = async (req, res) => {
  try {
    const { error, value } = validate(validators.createOfferSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const data = { ...value };
    if (req.file) data.bannerImage = req.file.path;
    const offer = await Offer.create(data);
    sendSuccess(res, { offer }, 'Offer created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.createOfferSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const data = { ...value };
    if (req.file) data.bannerImage = req.file.path;
    const offer = await Offer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!offer) return sendError(res, 'Offer not found', 404);
    sendSuccess(res, { offer });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    if (!offer) return sendError(res, 'Offer not found', 404);
    offer.status = offer.status === 'active' ? 'inactive' : 'active';
    await offer.save();
    sendSuccess(res, { offer });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await Offer.findByIdAndDelete(id);
    sendSuccess(res, null, 'Offer deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

// Mobile: returns bare array (ERB shape)
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('productIds').sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: returns { discount, message } (ERB shape)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: 'كود الخصم مطلوب' });

    const total = orderTotal || subtotal || 0;

    // Try Offer model first (supports both code and couponCode fields)
    const Offer  = require('../models/Offer');
    const now    = new Date();
    const offer  = await Offer.findOne({
      $or: [{ code }, { couponCode: code }],
      status: 'active',
      startDate: { $lte: now },
      endDate:   { $gte: now },
    });

    if (!offer) {
      // Fallback: Coupon model
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
      if (!coupon) return res.status(404).json({ message: 'كود الخصم غير صالح أو منتهي الصلاحية' });
      if (coupon.expiryDate && coupon.expiryDate < now) {
        return res.status(400).json({ message: 'كود الخصم منتهي الصلاحية' });
      }
      const discount = coupon.discountType === 'percentage'
        ? Math.round((total * coupon.discountValue / 100) * 100) / 100
        : coupon.discountValue;
      return res.json({ discount, message: 'تم تطبيق الخصم بنجاح' });
    }

    const maxUses   = offer.maxUses || offer.usageLimit || 0;
    const usedCount = offer.usedCount || offer.usageCount || 0;
    if (maxUses > 0 && usedCount >= maxUses) {
      return res.status(400).json({ message: 'تم استنفاذ عدد مرات استخدام الكود' });
    }

    const discount = offer.discountType === 'percentage'
      ? Math.round((total * offer.discountValue / 100) * 100) / 100
      : Math.min(offer.discountValue || 0, total);

    res.json({ discount, message: 'تم تطبيق الخصم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
