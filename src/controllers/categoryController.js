const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validators, validate } = require('../utils/validators');

exports.getCategories = async (req, res) => {
  try {
    const Product = require('../models/Product');

    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();

    // Add productsCount to each category (matches ERB response shape)
    const withCount = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        productsCount: await Product.countDocuments({ category: cat._id, isActive: true }),
      }))
    );

    // ERB returns a direct array (no wrapper object)
    res.json(withCount);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { error, value } = validate(validators.createCategorySchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const category = await Category.create(value);
    sendSuccess(res, { category }, 'Category created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Category name already exists', 409);
    }
    sendError(res, error.message, 500, error);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.updateCategorySchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const category = await Category.findByIdAndUpdate(id, value, { new: true, runValidators: true });
    if (!category) return sendError(res, 'Category not found', 404);
    sendSuccess(res, { category });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Category name already exists', 409);
    }
    sendError(res, error.message, 500, error);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) return sendError(res, 'Category not found', 404);
    sendSuccess(res, null, 'Category deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
