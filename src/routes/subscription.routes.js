const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const Subscription = require('../models/Subscription');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'driver') return res.status(403).json({ message: 'Customer access required' });
    next();
  });
};

/**
 * @swagger
 * /subscriptions/my:
 *   get:
 *     summary: "[MOBILE] Get logged-in customer's subscriptions"
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of customer subscriptions
 */
router.get('/my', verifyCustomer, async (req, res) => {
  try {
    const subs = await Subscription.find({ customerId: req.user.id })
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /subscriptions/{id}/status:
 *   patch:
 *     summary: "[MOBILE] Update customer's own subscription status"
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, paused, cancelled] }
 *     responses:
 *       200:
 *         description: Subscription status updated
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Subscription not found
 */
router.patch('/:id/status', verifyCustomer, async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'الاشتراك غير موجود' });
    if (sub.customerId?.toString() !== req.user.id?.toString()) {
      return res.status(401).json({ message: 'غير مصرح' });
    }
    sub.status = req.body.status;
    await sub.save();
    res.json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Recurring order subscription management
 */

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Subscriptions]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, cancelled]
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: List of subscriptions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, subscriptionController.getSubscriptions);

/**
 * @swagger
 * /subscriptions/stats:
 *   get:
 *     summary: Get subscription statistics
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', verifyToken, subscriptionController.getSubscriptionStats);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - items
 *               - frequency
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               deliveryAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), subscriptionController.createSubscription);

/**
 * @swagger
 * /subscriptions/{id}:
 *   put:
 *     summary: Update a subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly]
 *               status:
 *                 type: string
 *                 enum: [active, paused]
 *               deliveryAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Subscription not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), subscriptionController.updateSubscription);

/**
 * @swagger
 * /subscriptions/{id}:
 *   delete:
 *     summary: Cancel a subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Subscription not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), subscriptionController.cancelSubscription);

module.exports = router;
