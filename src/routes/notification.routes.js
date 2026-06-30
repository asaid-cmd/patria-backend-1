const express = require('express');
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');
const Customer = require('../models/Customer');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'driver') return res.status(403).json({ message: 'Customer access required' });
    next();
  });
};

/**
 * @swagger
 * /notifications/register-token:
 *   post:
 *     summary: "[MOBILE] Register FCM device token for push notifications"
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM device token
 *     responses:
 *       200:
 *         description: Token registered
 */
router.post('/register-token', verifyCustomer, async (req, res) => {
  try {
    const token = req.body.token || req.body.fcmToken;
    if (!token) return res.status(400).json({ message: 'token مطلوب' });
    await Customer.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: token } });
    res.json({ message: 'Token registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /notifications/unregister-token:
 *   delete:
 *     summary: "[MOBILE] Unregister FCM device token"
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token unregistered
 */
router.delete('/unregister-token', verifyCustomer, async (req, res) => {
  try {
    const token = req.body.token || req.body.fcmToken;
    if (!token) return res.status(400).json({ message: 'token مطلوب' });
    await Customer.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: token } });
    res.json({ message: 'Token unregistered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter by unread notifications only
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, notificationController.getNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', verifyToken, notificationController.markAsRead);

module.exports = router;
