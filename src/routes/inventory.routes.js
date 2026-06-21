const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory and stock management
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
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
 *     responses:
 *       200:
 *         description: Inventory list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, inventoryController.getInventory);

/**
 * @swagger
 * /inventory/shortages:
 *   get:
 *     summary: Get expected inventory shortages
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expected shortages retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/shortages', verifyToken, inventoryController.getExpectedShortages);

/**
 * @swagger
 * /inventory/synchronize:
 *   post:
 *     summary: Synchronize inventory with current stock levels
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory synchronized successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/synchronize', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.synchronizeInventory);

/**
 * @swagger
 * /inventory/{id}/stock:
 *   put:
 *     summary: Update stock for an inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Inventory item not found
 */
router.put('/:id/stock', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.updateStock);

/**
 * @swagger
 * /inventory/bulk-update:
 *   put:
 *     summary: Bulk update stock for multiple inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Bulk stock update completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.put('/bulk-update', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.bulkUpdateStock);

module.exports = router;
