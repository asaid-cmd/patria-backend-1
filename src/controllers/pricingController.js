const { PricingRule, PriceList } = require('../models/PricingRule');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getPricingRules = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from) filter.startDate = { $gte: new Date(from) };
    if (to) filter.endDate = { ...filter.endDate, $lte: new Date(to) };

    const rules = await PricingRule.find().populate('applicableProductIds', 'name price');
    const priceLists = await PriceList.find({ isActive: true });

    const activeRules = rules.filter(r => r.isActive);
    const avgDiscount = activeRules.length
      ? activeRules.reduce((sum, r) => sum + Math.abs(r.value), 0) / activeRules.length
      : 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const monthlyRevenue = recentOrders[0]?.total || 0;

    sendSuccess(res, {
      rules,
      priceLists,
      stats: {
        activeRulesCount: activeRules.length,
        priceListsCount: priceLists.length,
        avgDiscountRate: Math.round(avgDiscount * 10) / 10,
        monthlyRevenue,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createPricingRule = async (req, res) => {
  try {
    const { name, type, adjustmentType, value, minQuantity, applicableProductIds, startDate, endDate } = req.body;

    if (!name || value === undefined) return sendError(res, 'Name and value are required', 400);

    const rule = await PricingRule.create({
      name,
      type: type || 'bulk_discount',
      adjustmentType: adjustmentType || 'percentage',
      value,
      minQuantity: minQuantity || 1,
      applicableProductIds: applicableProductIds || [],
      startDate,
      endDate,
    });

    sendSuccess(res, { rule }, 'Pricing rule created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await PricingRule.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!rule) return sendError(res, 'Pricing rule not found', 404);
    sendSuccess(res, { rule });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    await PricingRule.findByIdAndUpdate(id, { isActive: false });
    sendSuccess(res, null, 'Pricing rule deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getPriceLists = async (req, res) => {
  try {
    const lists = await PriceList.find({ isActive: true }).populate('items.productId', 'name price');
    sendSuccess(res, { priceLists: lists });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createPriceList = async (req, res) => {
  try {
    const { name, description, items } = req.body;
    if (!name) return sendError(res, 'Price list name is required', 400);

    const list = await PriceList.create({ name, description, items: items || [] });
    sendSuccess(res, { priceList: list }, 'Price list created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updatePriceList = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await PriceList.findByIdAndUpdate(id, req.body, { new: true });
    if (!list) return sendError(res, 'Price list not found', 404);
    sendSuccess(res, { priceList: list });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deletePriceList = async (req, res) => {
  try {
    const { id } = req.params;
    await PriceList.findByIdAndUpdate(id, { isActive: false });
    sendSuccess(res, null, 'Price list deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
