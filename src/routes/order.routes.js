const express = require('express');
const orderController = require('../controllers/orderController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'customer') {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Customer access required', 403);
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
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
 *           enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [dine-in, takeaway, delivery]
 *         description: Filter by order type
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get customer's own orders
 *     tags: [Orders]
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
 *         description: Paginated customer orders
 */
router.get('/my-orders', verifyCustomer, orderController.getMyOrders);

/**
 * @swagger
 * /orders/reorder/{id}:
 *   post:
 *     summary: Repeat a previous order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Original order ID
 *     responses:
 *       201:
 *         description: New order created from previous order
 */
router.post('/reorder/:id', verifyCustomer, orderController.reorder);

// Dashboard order routes
router.get('/', verifyToken, orderController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', verifyToken, orderController.getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [dine-in, takeaway, delivery]
 *               tableId:
 *                 type: string
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
 *                     notes:
 *                       type: string
 *               couponCode:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires CASHIER, STAFF, ADMIN, or MANAGER role
 */
router.post('/', (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'customer') {
      return orderController.placeCustomerOrder(req, res, next);
    }
    const allowedRoles = [ROLES.CASHIER, ROLES.STAFF, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN];
    if (!allowedRoles.includes(req.user.role)) {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Forbidden', 403);
    }
    return orderController.createOrder(req, res, next);
  });
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
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
 *                 enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.put('/:id', verifyToken, orderController.updateOrderStatus);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Order not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), orderController.deleteOrder);

module.exports = router;
