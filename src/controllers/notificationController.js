const Notification = require('../models/Notification');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = await Notification.find({ userId, isRead: false }).sort({ createdAt: -1 });
    sendSuccess(res, { notifications });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!notification) return sendError(res, 'Notification not found', 404);
    sendSuccess(res, { notification });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

// v2 customer notification endpoints
exports.registerDeviceToken = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    if (!fcmToken) return sendError(res, 'fcmToken is required', 400);

    await Customer.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: fcmToken } });
    sendSuccess(res, null, 'Device token registered');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.unregisterDeviceToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return sendError(res, 'fcmToken is required', 400);

    await Customer.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: fcmToken } });
    sendSuccess(res, null, 'Device token removed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getCustomerNotifications = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const notifications = await Notification.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Notification.countDocuments({ customerId: req.user.id });
    sendSuccess(res, paginatedResult(notifications, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ customerId: req.user.id, isRead: false });
    sendSuccess(res, { count });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ customerId: req.user.id, isRead: false }, { isRead: true });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markOneRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, customerId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return sendError(res, 'Notification not found', 404);
    sendSuccess(res, { notification });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
