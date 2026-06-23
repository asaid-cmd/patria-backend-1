const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getProducts = async (req, res) => {
  try {
    const { categoryId, category, search } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = { isActive: true };
    if (categoryId || category) query.categoryId = categoryId || category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).populate('categoryId').skip(skip).limit(limit);
    const total = await Product.countDocuments(query);
    sendSuccess(res, paginatedResult(products, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId');
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, { product });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.rateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return sendError(res, 'Rating must be between 1 and 5', 400);

    const product = await Product.findById(id);
    if (!product) return sendError(res, 'Product not found', 404);

    const currentTotal = (product.avgRating || 0) * (product.ratingCount || 0);
    const newCount = (product.ratingCount || 0) + 1;
    const newAvg = (currentTotal + rating) / newCount;

    await Product.findByIdAndUpdate(id, { avgRating: Math.round(newAvg * 10) / 10, ratingCount: newCount });
    sendSuccess(res, { avgRating: Math.round(newAvg * 10) / 10, ratingCount: newCount }, 'Rating submitted');
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
