const express = require('express');
const driverController = require('../controllers/driverController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const verifyDriver = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'driver') {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Driver access required', 403);
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Driver mobile app — auth, shift, orders, location, notifications
 */

/**
 * @swagger
 * /drivers/login:
 *   post:
 *     summary: Driver login
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful — returns token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', driverController.login);

/**
 * @swagger
 * /drivers/me:
 *   get:
 *     summary: Get driver profile + shift stats
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile with shift statistics
 */
router.get('/me', verifyDriver, driverController.getProfile);

/**
 * @swagger
 * /drivers/me:
 *   put:
 *     summary: Update driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', verifyDriver, driverController.updateProfile);

/**
 * @swagger
 * /drivers/me:
 *   delete:
 *     summary: Delete driver account
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete('/me', verifyDriver, driverController.deleteAccount);

/**
 * @swagger
 * /drivers/shift/start:
 *   post:
 *     summary: Start driver shift
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shift started
 */
router.post('/shift/start', verifyDriver, driverController.startShift);

/**
 * @swagger
 * /drivers/shift/end:
 *   post:
 *     summary: End driver shift
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shift ended with delivery count
 */
router.post('/shift/end', verifyDriver, driverController.endShift);

/**
 * @swagger
 * /drivers/shift/request-overtime:
 *   post:
 *     summary: Request overtime
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overtime request submitted
 */
router.post('/shift/request-overtime', verifyDriver, driverController.requestOvertime);

/**
 * @swagger
 * /drivers/my-orders:
 *   get:
 *     summary: Get driver's active orders + last 30 days history
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active and history orders
 */
router.get('/my-orders', verifyDriver, driverController.getMyOrders);

/**
 * @swagger
 * /drivers/orders:
 *   get:
 *     summary: Get today's orders (in-progress + delivered)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's orders split by status
 */
router.get('/orders', verifyDriver, driverController.getTodayOrders);

/**
 * @swagger
 * /drivers/orders/{orderId}/status:
 *   put:
 *     summary: Update order delivery status
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deliveryStatus]
 *             properties:
 *               deliveryStatus:
 *                 type: string
 *                 enum: [Picking Up, Picked Up, Delivering, Near Customer, Delivered, Failed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/orders/:orderId/status', verifyDriver, driverController.updateOrderStatus);

/**
 * @swagger
 * /drivers/location:
 *   put:
 *     summary: Update driver GPS location
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 31.2156
 *               lng:
 *                 type: number
 *                 example: 29.9553
 *               accuracy:
 *                 type: number
 *                 example: 15.0
 *     responses:
 *       200:
 *         description: Location updated (also updates active order driverLocation)
 */
router.put('/location', verifyDriver, driverController.updateLocation);

/**
 * @swagger
 * /drivers/fcm-token:
 *   put:
 *     summary: Register FCM push token
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token registered
 */
router.put('/fcm-token', verifyDriver, driverController.registerFcmToken);

/**
 * @swagger
 * /drivers/fcm-token:
 *   delete:
 *     summary: Unregister FCM push token (on logout)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token removed
 */
router.delete('/fcm-token', verifyDriver, driverController.unregisterFcmToken);

/**
 * @swagger
 * /drivers/notifications:
 *   get:
 *     summary: Get driver notifications inbox
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Driver notifications
 */
router.get('/notifications', verifyDriver, driverController.getNotifications);

/**
 * @swagger
 * /drivers/notifications/mark-read:
 *   patch:
 *     summary: Mark all driver notifications as read
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.patch('/notifications/mark-read', verifyDriver, driverController.markAllNotificationsRead);

/**
 * @swagger
 * /drivers/notifications/{id}/read:
 *   patch:
 *     summary: Mark single notification as read
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/notifications/:id/read', verifyDriver, driverController.markNotificationRead);

module.exports = router;
