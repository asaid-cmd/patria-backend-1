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

exports.placeCustomerOrder = async (req, res) => {
  try {
    const { orderType, items, customer, summary, payment, notes, couponCode } = req.body;
    if (!items || !items.length) return sendError(res, 'items are required', 400);

    const order = await Order.create({
      type: orderType || 'Delivery',
      customerId: req.user.id,
      customer,
      items,
      subtotal: summary?.subtotal,
      deliveryFee: summary?.deliveryFee || 0,
      total: summary?.total,
      paymentMethod: payment?.method || 'Cash',
      notes,
      couponCode,
      status: 'pending',
    });

    sendSuccess(res, { order }, 'Order placed', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const orders = await Order.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Order.countDocuments({ customerId: req.user.id });
    sendSuccess(res, paginatedResult(orders, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.reorder = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await Order.findOne({ _id: id, customerId: req.user.id });
    if (!original) return sendError(res, 'Order not found', 404);

    const newOrder = await Order.create({
      type: original.type,
      customerId: req.user.id,
      customer: original.customer,
      items: original.items,
      subtotal: original.subtotal,
      deliveryFee: original.deliveryFee,
      total: original.total,
      paymentMethod: original.paymentMethod,
      notes: original.notes,
      status: 'pending',
    });

    sendSuccess(res, { order: newOrder }, 'Reorder placed', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate('assignedDriver', 'name phone location')
      .select('status deliveryStatus driverLocation customerLocation assignedDriver customer createdAt');
    if (!order) return sendError(res, 'Order not found', 404);
    sendSuccess(res, { tracking: order });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.saveCustomerLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) return sendError(res, 'lat and lng are required', 400);

    const order = await Order.findOneAndUpdate(
      { _id: orderId, customerId: req.user.id },
      { customerLocation: { lat, lng } },
      { new: true }
    );
    if (!order) return sendError(res, 'Order not found', 404);
    sendSuccess(res, null, 'Customer location saved');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
