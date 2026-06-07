const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = { isActive: true };
    if (categoryId) query.categoryId = categoryId;

    const products = await Product.find(query).populate('categoryId').skip(skip).limit(limit);
    const total = await Product.countDocuments(query);
    sendSuccess(res, paginatedResult(products, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { error, value } = validate(validators.createProductSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const data = {
      ...value,
      images: req.files ? req.files.map(f => f.path) : [],
    };
    const product = await Product.create(data);
    sendSuccess(res, { product }, 'Product created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.createProductSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const data = { ...value };
    if (req.files) {
      data.images = req.files.map(f => f.path);
    }
    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, { product });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, null, 'Product deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
