const express = require('express');
const { verifyToken } = require('../middleware/auth');
const customerAuthController = require('../controllers/customerAuthController');
const notificationController = require('../controllers/notificationController');
const customerSearchController = require('../controllers/customerSearchController');
const zoneController = require('../controllers/zoneController');
const orderController = require('../controllers/orderController');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    // Customer tokens have no role field (just { id }).
    // Only block driver tokens from accessing customer routes.
    if (req.user.role === 'driver') {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Customer access required', 403);
    }
    next();
  });
};

// ─── Addresses ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Customer saved delivery addresses
 */

/**
 * @swagger
 * /v2/addresses:
 *   get:
 *     summary: Get all saved addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 */
router.get('/addresses', verifyCustomer, customerAuthController.getAddresses);

/**
 * @swagger
 * /v2/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address]
 *             properties:
 *               label:
 *                 type: string
 *                 example: Home
 *               address:
 *                 type: string
 *                 example: "123 Main St, Alexandria"
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address added
 */
router.post('/addresses', verifyCustomer, customerAuthController.addAddress);

/**
 * @swagger
 * /v2/addresses/{addressId}:
 *   put:
 *     summary: Update address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               address:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Address updated
 */
router.put('/addresses/:addressId', verifyCustomer, customerAuthController.updateAddress);

/**
 * @swagger
 * /v2/addresses/{addressId}:
 *   delete:
 *     summary: Delete address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted
 */
router.delete('/addresses/:addressId', verifyCustomer, customerAuthController.deleteAddress);

// ─── Notifications ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Customer push notifications
 */

/**
 * @swagger
 * /v2/notifications/device:
 *   post:
 *     summary: Register FCM device token
 *     tags: [Notifications]
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
 *               platform:
 *                 type: string
 *                 enum: [android, ios]
 *     responses:
 *       200:
 *         description: Device token registered
 */
router.post('/notifications/device', verifyCustomer, notificationController.registerDeviceToken);

/**
 * @swagger
 * /v2/notifications/device:
 *   delete:
 *     summary: Unregister FCM device token
 *     tags: [Notifications]
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
 *         description: Device token removed
 */
router.delete('/notifications/device', verifyCustomer, notificationController.unregisterDeviceToken);

/**
 * @swagger
 * /v2/notifications:
 *   get:
 *     summary: Get customer notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated notifications
 */
router.get('/notifications', verifyCustomer, notificationController.getCustomerNotifications);

/**
 * @swagger
 * /v2/notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/notifications/unread-count', verifyCustomer, notificationController.getUnreadCount);

/**
 * @swagger
 * /v2/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.patch('/notifications/read-all', verifyCustomer, notificationController.markAllRead);

/**
 * @swagger
 * /v2/notifications/{id}/read:
 *   patch:
 *     summary: Mark single notification as read
 *     tags: [Notifications]
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
router.patch('/notifications/:id/read', verifyCustomer, notificationController.markOneRead);

// ─── Search ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Customer search history and trending
 */

/**
 * @swagger
 * /v2/customer-search/log:
 *   post:
 *     summary: Log a search query
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "ethiopian coffee"
 *     responses:
 *       200:
 *         description: Search logged
 */
router.post('/customer-search/log', verifyCustomer, customerSearchController.logSearch);

/**
 * @swagger
 * /v2/customer-search/last:
 *   get:
 *     summary: Get last search query
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Last search query
 */
router.get('/customer-search/last', verifyCustomer, customerSearchController.getLastSearch);

/**
 * @swagger
 * /v2/customer-search/trending:
 *   get:
 *     summary: Get trending searches (public — no auth required)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Number of trending results to return
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 *         description: Lookback window in days
 *     responses:
 *       200:
 *         description: Top trending searches
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   query: { type: string, example: "كابتشينو" }
 *                   count: { type: integer, example: 45 }
 */
router.get('/customer-search/trending', customerSearchController.getTrending);

/**
 * @swagger
 * /v2/customer-search/history:
 *   get:
 *     summary: Get customer's search history
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: "Direct array — last N searches sorted newest first"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   query:      { type: string, example: "لاتيه" }
 *                   searchedAt: { type: string, format: date-time }
 */
router.get('/customer-search/history', verifyCustomer, customerSearchController.getHistory);

/**
 * @swagger
 * /v2/customer-search/history:
 *   delete:
 *     summary: Clear search history
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History cleared
 */
router.delete('/customer-search/history', verifyCustomer, customerSearchController.clearHistory);

// ─── Zones ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Zones
 *   description: Delivery zones (public)
 */

/**
 * @swagger
 * /v2/zones:
 *   get:
 *     summary: Get all active delivery zones
 *     tags: [Zones]
 *     responses:
 *       200:
 *         description: List of delivery zones with fees
 */
router.get('/zones', zoneController.getZones);

/**
 * @swagger
 * /v2/zones/lookup:
 *   get:
 *     summary: Find delivery zone by GPS coordinates
 *     tags: [Zones]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 31.2001
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: 29.9187
 *     responses:
 *       200:
 *         description: Matched zone with delivery fee
 *       404:
 *         description: No delivery zone for this location
 */
router.get('/zones/lookup', zoneController.lookupZone);

// ─── Orders v2 ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /v2/orders/{orderId}/tracking:
 *   get:
 *     summary: Live order tracking (status + driver location)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live tracking data (status, deliveryStatus, driverLocation, assignedDriver)
 *       404:
 *         description: Order not found
 */
router.get('/orders/:orderId/tracking', orderController.getOrderTracking);

/**
 * @swagger
 * /v2/orders/{orderId}/customer-location:
 *   patch:
 *     summary: Save customer GPS location to order
 *     tags: [Orders]
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
 *             required: [lat, lng]
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location saved
 */
router.patch('/orders/:orderId/customer-location', verifyCustomer, orderController.saveCustomerLocation);

module.exports = router;
