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

exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      status: 'active',
      $or: [
        { endDate: { $gte: now } },
        { endDate: null },
      ],
    }).populate('productIds').sort({ createdAt: -1 });
    sendSuccess(res, { offers });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return sendError(res, 'code is required', 400);

    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return sendError(res, 'Invalid or expired coupon', 404);

    const now = new Date();
    if (coupon.expiryDate && coupon.expiryDate < now) {
      return sendError(res, 'Coupon has expired', 400);
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return sendError(res, 'Coupon usage limit reached', 400);
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return sendError(res, `Minimum order amount is ${coupon.minOrderAmount}`, 400);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }

    sendSuccess(res, {
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: Math.round(discount * 100) / 100,
      newTotal: Math.max(0, orderTotal - discount),
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
