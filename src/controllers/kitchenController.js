const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { ORDER_STATUS, KITCHEN_STATUS } = require('../config/constants');
const { validators, validate } = require('../utils/validators');

exports.getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING] }
    }).populate('tableId items.productId').sort({ createdAt: 1 });

    sendSuccess(res, { orders });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateKitchenOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.updateKitchenOrderStatusSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const { itemIndex, status } = value;
    const order = await Order.findById(id);
    if (!order) return sendError(res, 'Order not found', 404);

    if (itemIndex !== undefined) {
      order.items[itemIndex].kitchenStatus = status;
      const allReady = order.items.every(item => item.kitchenStatus === KITCHEN_STATUS.READY);
      if (allReady) {
        order.status = ORDER_STATUS.READY;
      }
    } else {
      order.items.forEach(item => item.kitchenStatus = status);
      order.status = ORDER_STATUS.READY;
    }

    await order.save();
    sendSuccess(res, { order });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
