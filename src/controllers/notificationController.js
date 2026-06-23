const UserNotification = require('../models/UserNotification');
const Customer         = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams }    = require('../utils/pagination');

/* ── Dashboard: legacy notification list ────────────────────────────── */
exports.getNotifications = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    sendSuccess(res, { notifications });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notification = await Notification.findByIdAndUpdate(
      req.params.id, { isRead: true }, { new: true }
    );
    if (!notification) return sendError(res, 'Notification not found', 404);
    sendSuccess(res, { notification });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Mobile: FCM device token management ────────────────────────────── */
exports.registerDeviceToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
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

/* ── Mobile: customer notifications inbox ───────────────────────────── */
exports.getCustomerNotifications = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const filter = { customerId: req.user.id };

    const [notifications, unreadCount, total] = await Promise.all([
      UserNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserNotification.countDocuments({ ...filter, read: false }),
      UserNotification.countDocuments(filter),
    ]);

    sendSuccess(res, {
      notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await UserNotification.countDocuments({
      customerId: req.user.id,
      read: false,
    });
    sendSuccess(res, { unreadCount });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await UserNotification.updateMany(
      { customerId: req.user.id, read: false },
      { read: true }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markOneRead = async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return sendError(res, 'Notification not found', 404);
    sendSuccess(res, { notification });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
