const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Purchasing
 *   description: Purchase order management
 */

/**
 * @swagger
 * /purchasing:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchasing]
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
 *         description: Filter by purchase order status
 *     responses:
 *       200:
 *         description: List of purchase orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, purchaseController.getPurchaseOrders);

/**
 * @swagger
 * /purchasing:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Purchasing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - items
 *             properties:
 *               supplierId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               expectedDeliveryDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.createPurchaseOrder);

/**
 * @swagger
 * /purchasing/{id}/submit:
 *   post:
 *     summary: Submit a purchase order to the supplier
 *     tags: [Purchasing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order submitted to supplier successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Purchase order not found
 */
router.post('/:id/submit', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.submitToSupplier);

/**
 * @swagger
 * /purchasing/{id}/payment:
 *   post:
 *     summary: Record payment for a purchase order
 *     tags: [Purchasing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, bank_transfer, credit]
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Purchase order not found
 */
router.post('/:id/payment', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.makePayment);

/**
 * @swagger
 * /purchasing/{id}/receive:
 *   post:
 *     summary: Mark a purchase order as received
 *     tags: [Purchasing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase order marked as received successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Purchase order not found
 */
router.post('/:id/receive', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.markReceived);

/**
 * @swagger
 * /purchasing/{id}/cancel:
 *   post:
 *     summary: Cancel a purchase order
 *     tags: [Purchasing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase order cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Purchase order not found
 */
router.post('/:id/cancel', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.cancelPurchaseOrder);

module.exports = router;
