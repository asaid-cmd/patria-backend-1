const Product  = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

/* Map product to ERB shape exactly */
function productShape(p) {
  const obj = p.toObject ? p.toObject() : p;

  // category = string (category name), not object
  const catObj = obj.category || obj.categoryId;
  const catName = typeof catObj === 'string' ? catObj : (catObj?.name || '');

  // variantGroups: add label (= name) to each option, add virtual id
  const variantGroups = (obj.variantGroups || []).map(vg => ({
    name:     vg.name,
    required: vg.required || false,
    options: (vg.options || []).map(opt => ({
      label:           opt.label || opt.name,
      priceAdjustment: opt.priceAdjustment || 0,
      _id:             opt._id,
      id:              opt._id ? String(opt._id) : undefined,
    })),
    _id: vg._id,
    id:  vg._id ? String(vg._id) : undefined,
  }));

  // extras: add virtual id
  const extras = (obj.extras || []).map(e => ({
    name:     e.name,
    price:    e.price || 0,
    isActive: e.isActive !== false,
    _id:      e._id,
    id:       e._id ? String(e._id) : undefined,
  }));

  const inventory = obj.stockQty || obj.inventory || 0;

  return {
    customizationOptions: {
      roastLevels: ['Light', 'Medium', 'Dark'],
      grindTypes:  ['Whole Bean', 'Espresso', 'Filter'],
    },
    _id:              obj._id,
    name:             obj.name,
    description:      obj.description || '',
    price:            obj.price || 0,
    category:         catName,
    image:            obj.images?.[0] || obj.image || null,
    rate:             obj.avgRating    || obj.rate         || 0,
    reviewsCount:     obj.ratingCount  || obj.reviewsCount || 0,
    locationStock:    obj.locationStock    || [],
    lowStockThreshold:obj.lowStockThreshold || 10,
    isIngredient:     obj.isIngredient  || false,
    unit:             obj.unit          || 'pcs',
    isActive:         obj.isActive !== false,
    inventory,
    variantGroups,
    sizes:            obj.sizes     || [],
    createdAt:        obj.createdAt,
    updatedAt:        obj.updatedAt,
    __v:              obj.__v || 0,
    costPrice:        obj.costPrice || 0,
    barcode:          obj.barcode   || null,
    extras,
    totalInventory:         inventory,
    haveCustomizationOption: variantGroups.length > 0,
    id:       obj._id ? String(obj._id) : '',
    hasRecipe: false,
  };
}

/* ── Mobile: GET /api/mobile/products  →  { products, page, pages, total } */
exports.getProducts = async (req, res) => {
  try {
    const { categoryId, category, search } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = { isActive: true };

    if (categoryId || category) {
      const catValue = categoryId || category;
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(catValue)) {
        // Valid ObjectId — filter directly
        query.$or = [{ categoryId: catValue }, { category: catValue }];
      } else {
        // Category name string — resolve to _id first
        const Category = require('../models/Category');
        const cat = await Category.findOne({ name: { $regex: `^${catValue}$`, $options: 'i' } }).lean();
        if (cat) {
          query.$or = [{ categoryId: cat._id }, { category: cat._id }];
        } else {
          // No matching category — return empty
          return res.json({ products: [], page: 1, pages: 0, total: 0 });
        }
      }
    }

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

function parseFormJsonFields(body) {
  const parsed = { ...body };
  for (const key of ['variantGroups', 'extras']) {
    if (typeof parsed[key] === 'string') {
      try { parsed[key] = JSON.parse(parsed[key]); } catch (_) { /* leave as-is */ }
    }
  }
  return parsed;
}

/* ── Dashboard CRUD (keep sendSuccess for dashboard) */
exports.createProduct = async (req, res) => {
  try {
    const body = parseFormJsonFields(req.body);
    const { error, value } = validate(validators.createProductSchema, body);
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
    const body = parseFormJsonFields(req.body);
    const { error, value } = validate(validators.createProductSchema, body);
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
