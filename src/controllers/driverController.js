const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const generateDriverToken = (driverId) => {
  return jwt.sign(
    { id: driverId, role: 'driver' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '24h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return sendError(res, 'phone and password are required', 400);

    const driver = await Driver.findOne({ $or: [{ phone }, { whatsappPhone: phone }], isActive: true });
    if (!driver) return sendError(res, 'Invalid credentials', 401);
    if (!driver.password) return sendError(res, 'Account not set up for mobile login. Contact admin to set password.', 401);

    const valid = await driver.comparePassword(password);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    const token = generateDriverToken(driver._id);
    sendSuccess(res, { driver: driver.toJSON(), token }, 'Login successful');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver) return sendError(res, 'Driver not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDeliveries = await Order.countDocuments({
      assignedDriver: driver._id,
      deliveryStatus: 'Delivered',
      updatedAt: { $gte: today },
    });

    sendSuccess(res, {
      driver: driver.toJSON(),
      shiftStats: {
        isOnShift: driver.isOnShift,
        shiftStartedAt: driver.shiftStartedAt,
        todayDeliveries,
        shiftDeliveriesCount: driver.shiftDeliveriesCount,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );
    sendSuccess(res, { driver: driver.toJSON() }, 'Profile updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await Driver.findByIdAndUpdate(req.user.id, { isActive: false });
    sendSuccess(res, null, 'Account deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.startShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver) return sendError(res, 'Driver not found', 404);
    if (driver.isOnShift) return sendError(res, 'Shift already started', 400);

    await Driver.findByIdAndUpdate(req.user.id, {
      isOnShift: true,
      shiftStartedAt: new Date(),
      shiftDeliveriesCount: 0,
      status: 'active',
    });

    sendSuccess(res, null, 'Shift started');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.endShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver) return sendError(res, 'Driver not found', 404);
    if (!driver.isOnShift) return sendError(res, 'No active shift', 400);

    await Driver.findByIdAndUpdate(req.user.id, {
      isOnShift: false,
      shiftStartedAt: null,
      status: 'offline',
    });

    sendSuccess(res, { deliveriesCompleted: driver.shiftDeliveriesCount }, 'Shift ended');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.requestOvertime = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver) return sendError(res, 'Driver not found', 404);
    if (!driver.isOnShift) return sendError(res, 'No active shift', 400);

    // In production: notify manager via notification/socket
    sendSuccess(res, null, 'Overtime request submitted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      assignedDriver: req.user.id,
      updatedAt: { $gte: since },
    }).sort({ createdAt: -1 });

    const active = orders.filter(o => !['Delivered', 'Failed'].includes(o.deliveryStatus));
    const history = orders.filter(o => ['Delivered', 'Failed'].includes(o.deliveryStatus));

    sendSuccess(res, { active, history });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getTodayOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      assignedDriver: req.user.id,
      createdAt: { $gte: today },
    }).sort({ createdAt: -1 });

    const inProgress = orders.filter(o => !['Delivered', 'Failed'].includes(o.deliveryStatus));
    const delivered = orders.filter(o => o.deliveryStatus === 'Delivered');

    sendSuccess(res, { inProgress, delivered });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    const validStatuses = ['Picking Up', 'Picked Up', 'Delivering', 'Near Customer', 'Delivered', 'Failed'];
    if (!validStatuses.includes(deliveryStatus)) {
      return sendError(res, `Invalid status. Valid values: ${validStatuses.join(', ')}`, 400);
    }

    const order = await Order.findOne({ _id: orderId, assignedDriver: req.user.id });
    if (!order) return sendError(res, 'Order not found', 404);

    order.deliveryStatus = deliveryStatus;
    if (deliveryStatus === 'Delivered') {
      order.status = 'completed';
      await Driver.findByIdAndUpdate(req.user.id, { $inc: { shiftDeliveriesCount: 1 }, currentOrderId: null, status: 'active' });
    }
    await order.save();

    sendSuccess(res, { order }, 'Order status updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    if (lat === undefined || lng === undefined) return sendError(res, 'lat and lng are required', 400);

    await Driver.findByIdAndUpdate(req.user.id, {
      location: { lat, lng, accuracy, updatedAt: new Date() },
    });

    // Update driverLocation on active order
    await Order.findOneAndUpdate(
      { assignedDriver: req.user.id, deliveryStatus: { $in: ['Picking Up', 'Picked Up', 'Delivering', 'Near Customer'] } },
      { driverLocation: { lat, lng, updatedAt: new Date() } }
    );

    sendSuccess(res, null, 'Location updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.registerFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return sendError(res, 'fcmToken is required', 400);

    await Driver.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: fcmToken } });
    sendSuccess(res, null, 'FCM token registered');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.unregisterFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return sendError(res, 'fcmToken is required', 400);

    await Driver.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: fcmToken } });
    sendSuccess(res, null, 'FCM token removed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const driver = await Driver.findById(req.user.id, 'notifications');
    if (!driver) return sendError(res, 'Driver not found', 404);

    const notifications = driver.notifications
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    sendSuccess(res, { notifications });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Driver.updateOne(
      { _id: req.user.id },
      { $set: { 'notifications.$[].isRead': true } }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Driver.updateOne(
      { _id: req.user.id, 'notifications._id': id },
      { $set: { 'notifications.$.isRead': true } }
    );
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
