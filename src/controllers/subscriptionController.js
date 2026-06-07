const Subscription = require('../models/Subscription');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getSubscriptions = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const subscriptions = await Subscription.find().populate('customerId productId').skip(skip).limit(limit);
    const total = await Subscription.countDocuments();
    sendSuccess(res, paginatedResult(subscriptions, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getSubscriptionStats = async (req, res) => {
  try {
    const active = await Subscription.countDocuments({ status: 'active' });
    const stats = { active };
    sendSuccess(res, { stats });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const { error, value } = validate(validators.createSubscriptionSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const subscription = await Subscription.create(value);
    sendSuccess(res, { subscription: await subscription.populate('customerId productId') }, 'Subscription created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.createSubscriptionSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const subscription = await Subscription.findByIdAndUpdate(id, value, { new: true, runValidators: true });
    if (!subscription) return sendError(res, 'Subscription not found', 404);
    sendSuccess(res, { subscription });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    if (!subscription) return sendError(res, 'Subscription not found', 404);
    sendSuccess(res, { subscription });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
