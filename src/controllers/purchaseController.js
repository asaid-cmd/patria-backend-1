const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { paymentStatus, status } = req.query;

    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (status) filter.status = status;

    const orders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'name email phone contactPerson contactPersonName')
      .populate('warehouseId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PurchaseOrder.countDocuments(filter);

    const allOrders = await PurchaseOrder.find();
    const totalPurchases = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingCount = allOrders.filter(o => o.status === 'submitted').length;
    const receivedCount = allOrders.filter(o => o.status === 'received').length;
    const cancelledCount = allOrders.filter(o => o.status === 'cancelled').length;

    sendSuccess(res, {
      ...paginatedResult(orders, total, page, limit),
      stats: { totalPurchases, pendingCount, receivedCount, cancelledCount },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { supplierId, warehouseId, items, expectedDeliveryDate, notes } = req.body;

    if (!supplierId) return sendError(res, 'Supplier is required', 400);
    if (!items || items.length === 0) return sendError(res, 'At least one item is required', 400);

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return sendError(res, 'Supplier not found', 404);

    const enrichedItems = items.map(item => ({
      ...item,
      subtotal: (item.quantity || 0) * (item.unitCost || 0),
    }));

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);

    const po = await PurchaseOrder.create({
      supplierId,
      warehouseId,
      items: enrichedItems,
      totalAmount,
      expectedDeliveryDate,
      notes,
    });

    await po.populate('supplierId', 'name email');
    sendSuccess(res, { purchaseOrder: po }, 'Purchase order created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.submitToSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await PurchaseOrder.findById(id);
    if (!po) return sendError(res, 'Purchase order not found', 404);
    if (po.status !== 'draft') return sendError(res, 'Only draft orders can be submitted', 400);

    po.status = 'submitted';
    po.submittedAt = new Date();
    await po.save();

    sendSuccess(res, { purchaseOrder: po }, 'Purchase order submitted to supplier');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) return sendError(res, 'Valid payment amount required', 400);

    const po = await PurchaseOrder.findById(id);
    if (!po) return sendError(res, 'Purchase order not found', 404);

    const remaining = po.totalAmount - po.paidAmount;
    if (amount > remaining) return sendError(res, `Payment exceeds remaining balance of ${remaining}`, 400);

    po.paidAmount += amount;

    if (po.paidAmount >= po.totalAmount) {
      po.paymentStatus = 'paid';
    } else if (po.paidAmount > 0) {
      po.paymentStatus = 'partial';
    }

    await po.save();
    sendSuccess(res, { purchaseOrder: po }, 'Payment recorded');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await PurchaseOrder.findById(id);
    if (!po) return sendError(res, 'Purchase order not found', 404);

    po.status = 'received';
    po.receivedAt = new Date();
    await po.save();

    sendSuccess(res, { purchaseOrder: po }, 'Purchase order marked as received');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await PurchaseOrder.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    if (!po) return sendError(res, 'Purchase order not found', 404);
    sendSuccess(res, { purchaseOrder: po }, 'Purchase order cancelled');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
