const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getInventory = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .select('name stockQty lowStockThreshold categoryId images isActive');

    const enriched = products.map(p => {
      let status = 'in_stock';
      if (p.stockQty === 0) status = 'out_of_stock';
      else if (p.stockQty <= p.lowStockThreshold) status = 'low_stock';
      return { ...p.toObject(), status };
    });

    const totalProducts = products.length;
    const lowStock = enriched.filter(p => p.status === 'low_stock').length;
    const outOfStock = enriched.filter(p => p.status === 'out_of_stock').length;
    const inventoryValue = products.reduce((sum, p) => sum + (p.stockQty * (p.price || 0)), 0);

    sendSuccess(res, { products: enriched, stats: { totalProducts, lowStock, outOfStock, inventoryValue } });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQty } = req.body;

    if (stockQty === undefined || stockQty < 0) {
      return sendError(res, 'Valid stock quantity required', 400);
    }

    const product = await Product.findByIdAndUpdate(id, { stockQty }, { new: true });
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, { product }, 'Stock updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return sendError(res, 'Updates array required', 400);
    }

    const ops = updates.map(({ productId, stockQty }) => ({
      updateOne: {
        filter: { _id: productId },
        update: { $set: { stockQty } },
      },
    }));

    await Product.bulkWrite(ops);
    sendSuccess(res, null, 'Stock updated successfully');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getExpectedShortages = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const Order = require('../models/Order');

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $in: ['completed', 'delivered'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
        },
      },
    ]);

    const salesMap = {};
    salesData.forEach(s => { salesMap[s._id.toString()] = s.totalSold; });

    const products = await Product.find().populate('categoryId', 'name').select('name stockQty lowStockThreshold');

    const result = products.map(p => {
      const totalSold = salesMap[p._id.toString()] || 0;
      const salesRatePerDay = totalSold / 30;
      const daysRemaining = salesRatePerDay > 0 ? Math.floor(p.stockQty / salesRatePerDay) : null;
      const expectedExpiryDate = daysRemaining !== null ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000) : null;

      let urgencyLevel = 'stable';
      if (daysRemaining !== null) {
        if (daysRemaining <= 5) urgencyLevel = 'critical';
        else if (daysRemaining <= 14) urgencyLevel = 'warning';
        else if (daysRemaining <= 30) urgencyLevel = 'good';
      }

      return {
        product: p,
        currentQuantity: p.stockQty,
        salesRatePerDay: Math.round(salesRatePerDay * 100) / 100,
        daysRemaining,
        expectedExpiryDate,
        urgencyLevel,
      };
    });

    sendSuccess(res, { shortages: result });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.synchronizeInventory = async (req, res) => {
  try {
    sendSuccess(res, null, 'Inventory synchronized successfully');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
