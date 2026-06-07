const Coupon = require('../models/Coupon');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getCoupons = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const coupons = await Coupon.find().skip(skip).limit(limit);
    const total = await Coupon.countDocuments();
    sendSuccess(res, paginatedResult(coupons, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { error, value } = validate(validators.createCouponSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const coupon = await Coupon.create(value);
    sendSuccess(res, { coupon }, 'Coupon created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Coupon code already exists', 409);
    }
    sendError(res, error.message, 500, error);
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.createCouponSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const coupon = await Coupon.findByIdAndUpdate(id, value, { new: true, runValidators: true });
    if (!coupon) return sendError(res, 'Coupon not found', 404);
    sendSuccess(res, { coupon });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Coupon code already exists', 409);
    }
    sendError(res, error.message, 500, error);
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    sendSuccess(res, null, 'Coupon deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
