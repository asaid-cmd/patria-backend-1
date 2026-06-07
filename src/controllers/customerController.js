const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getCustomers = async (req, res) => {
  try {
    const { tier } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = { isActive: true };
    if (tier) query.tier = tier;

    const customers = await Customer.find(query).skip(skip).limit(limit);
    const total = await Customer.countDocuments(query);
    sendSuccess(res, paginatedResult(customers, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const total = await Customer.countDocuments();
    const active = await Customer.countDocuments({ isActive: true });
    const stats = { total, active };
    sendSuccess(res, { stats });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.updateCustomerSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const customer = await Customer.findByIdAndUpdate(id, value, { new: true, runValidators: true });
    if (!customer) return sendError(res, 'Customer not found', 404);
    sendSuccess(res, { customer });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await Customer.findByIdAndUpdate(id, { isActive: false });
    sendSuccess(res, null, 'Customer deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
