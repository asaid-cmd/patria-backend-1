const Supplier = require('../models/Supplier');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getSuppliers = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const suppliers = await Supplier.find({ isActive: true }).skip(skip).limit(limit);
    const total = await Supplier.countDocuments({ isActive: true });
    sendSuccess(res, paginatedResult(suppliers, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { error, value } = validate(validators.createSupplierSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const supplier = await Supplier.create(value);
    sendSuccess(res, { supplier }, 'Supplier created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.updateSupplierSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const supplier = await Supplier.findByIdAndUpdate(id, value, { new: true, runValidators: true });
    if (!supplier) return sendError(res, 'Supplier not found', 404);
    sendSuccess(res, { supplier });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await Supplier.findByIdAndUpdate(id, { isActive: false });
    sendSuccess(res, null, 'Supplier deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
