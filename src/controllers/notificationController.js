/**
 * Notification Controller
 * Response format matches ERB exactly — flat JSON, no wrapper.
 * Device token field is `token` (not `fcmToken`) to match ERB.
 */

const UserNotification = require('../models/UserNotification');
const Customer         = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/* ── Dashboard: legacy notification list ────────────────────────────── */
exports.getNotifications = async (req, res) => {
  try {
    const Notification   = require('../models/Notification');
    const notifications  = await Notification.find().sort({ createdAt: -1 }).limit(100);
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
// ERB uses field name `token` (not `fcmToken`)
exports.registerDeviceToken = async (req, res) => {
  try {
    const token = req.body.token || req.body.fcmToken;
    if (!token) return res.status(400).json({ message: 'token مطلوب' });
    await Customer.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: token } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unregisterDeviceToken = async (req, res) => {
  try {
    const token = req.body.token || req.body.fcmToken;
    if (!token) return res.status(400).json({ message: 'token مطلوب' });
    await Customer.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: token } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Mobile: customer notifications inbox ───────────────────────────── */
exports.getCustomerNotifications = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 20;
    const page   = parseInt(req.query.page)  || 1;
    const skip   = (page - 1) * limit;
    const filter = { customerId: req.user.id };

    const [notifications, unreadCount, total] = await Promise.all([
      UserNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserNotification.countDocuments({ ...filter, read: false }),
      UserNotification.countDocuments(filter),
    ]);

    res.json({ notifications, unreadCount, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await UserNotification.countDocuments({
      customerId: req.user.id,
      read: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await UserNotification.updateMany(
      { customerId: req.user.id, read: false },
      { read: true }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markOneRead = async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'الإشعار غير موجود' });
    res.json({ ok: true, notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
