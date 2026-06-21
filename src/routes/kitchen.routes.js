const express = require('express');
const kitchenController = require('../controllers/kitchenController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kitchen
 *   description: Kitchen order management and real-time status updates
 */

/**
 * @swagger
 * /kitchen/orders:
 *   get:
 *     summary: Get all active kitchen orders
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kitchen orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires KITCHEN, ADMIN, or MANAGER role
 */
router.get('/orders', verifyToken, authorize(ROLES.KITCHEN, ROLES.ADMIN, ROLES.MANAGER), kitchenController.getKitchenOrders);

/**
 * @swagger
 * /kitchen/orders/{id}:
 *   put:
 *     summary: Update kitchen order status
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, ready, served]
 *               itemIndex:
 *                 type: integer
 *                 description: Index of the specific order item to update
 *     responses:
 *       200:
 *         description: Kitchen order status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires KITCHEN, ADMIN, or MANAGER role
 *       404:
 *         description: Order not found
 */
router.put('/orders/:id', verifyToken, authorize(ROLES.KITCHEN, ROLES.ADMIN, ROLES.MANAGER), kitchenController.updateKitchenOrderStatus);

module.exports = router;
