const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

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
