const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getOrders = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const orders = await Order.find().populate('tableId staffId items.productId').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Order.countDocuments();
    sendSuccess(res, paginatedResult(orders, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { error, value } = validate(validators.createOrderSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const { items, ...rest } = value;
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });
    const tax = subtotal * 0.14;
    const total = subtotal + tax;

    const order = await Order.create({
      items,
      subtotal,
      tax,
      total,
      staffId: req.user.id,
      ...rest,
    });

    sendSuccess(res, { order: await order.populate('items.productId') }, 'Order created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return sendError(res, 'Order not found', 404);
    sendSuccess(res, { order });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('tableId staffId items.productId');
    if (!order) return sendError(res, 'Order not found', 404);
    sendSuccess(res, { order });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    sendSuccess(res, null, 'Order deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
