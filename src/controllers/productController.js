const Product  = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

/* Map product to ERB shape — image is first item of images[] */
function productShape(p) {
  const obj = p.toObject ? p.toObject() : p;
  return {
    ...obj,
    image:    obj.images?.[0] || obj.image || null,
    category: obj.category || obj.categoryId || null,
  };
}

/* ── Mobile: GET /api/mobile/products  →  { products, page, pages, total } */
exports.getProducts = async (req, res) => {
  try {
    const { categoryId, category, search } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = { isActive: true };
    if (categoryId || category) query.$or = [{ categoryId: categoryId || category }, { category: categoryId || category }];
    if (search) query.name = { $regex: search, $options: 'i' };

    const [products, total] = await Promise.all([
      Product.find(query).populate('categoryId category').skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    // ERB shape: { products: [...], page, pages, total }
    res.json({
      products: products.map(productShape),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Mobile: GET /api/mobile/products/:id  →  flat product object (no wrapper) */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId category').lean();
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json(productShape(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateProduct = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

    const currentTotal = (product.avgRating || 0) * (product.ratingCount || 0);
    const newCount = (product.ratingCount || 0) + 1;
    const newAvg   = (currentTotal + rating) / newCount;

    await Product.findByIdAndUpdate(req.params.id, {
      avgRating:   Math.round(newAvg * 10) / 10,
      ratingCount: newCount,
    });
    res.json({ avgRating: Math.round(newAvg * 10) / 10, ratingCount: newCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Dashboard CRUD (keep sendSuccess for dashboard) */
exports.createProduct = async (req, res) => {
  try {
    const { error, value } = validate(validators.createProductSchema, req.body);
    if (error) return sendError(res, error.details.map(e => e.message).join(', '), 400);

    const data = { ...value, images: req.files ? req.files.map(f => f.path) : [] };
    data.category   = data.categoryId || data.category;
    data.categoryId = data.category;
    const product = await Product.create(data);
    sendSuccess(res, { product }, 'Product created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { error, value } = validate(validators.createProductSchema, req.body);
    if (error) return sendError(res, error.details.map(e => e.message).join(', '), 400);

    const data = { ...value };
    if (req.files) data.images = req.files.map(f => f.path);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, { product });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, null, 'Product deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
