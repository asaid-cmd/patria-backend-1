const express = require('express');
const logisticsController = require('../controllers/logisticsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Logistics
 *   description: Delivery driver and logistics management
 */

/**
 * @swagger
 * /logistics/drivers:
 *   get:
 *     summary: Get all delivery drivers
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of drivers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/drivers', verifyToken, logisticsController.getDrivers);

/**
 * @swagger
 * /logistics/drivers:
 *   post:
 *     summary: Create a new delivery driver
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *               vehiclePlate:
 *                 type: string
 *               zone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/drivers', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.createDriver);

/**
 * @swagger
 * /logistics/drivers/{id}:
 *   put:
 *     summary: Update a delivery driver
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
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
 *               vehicleType:
 *                 type: string
 *               vehiclePlate:
 *                 type: string
 *               zone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Driver not found
 */
router.put('/drivers/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.updateDriver);

/**
 * @swagger
 * /logistics/drivers/{id}:
 *   delete:
 *     summary: Delete a delivery driver
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Driver not found
 */
router.delete('/drivers/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.deleteDriver);

/**
 * @swagger
 * /logistics/dispatch:
 *   post:
 *     summary: Dispatch a driver for a delivery order
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - orderId
 *             properties:
 *               driverId:
 *                 type: string
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver dispatched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or CASHIER role
 *       404:
 *         description: Driver or order not found
 */
router.post('/dispatch', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), logisticsController.dispatchDriver);

/**
 * @swagger
 * /logistics/drivers/{id}/complete:
 *   post:
 *     summary: Mark a delivery as completed for a driver
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery marked as completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Driver not found
 */
router.post('/drivers/:id/complete', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.completeDelivery);
router.put('/drivers/:id/credentials', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.setDriverPassword);

/**
 * @swagger
 * /logistics/zones/{zone}/orders:
 *   get:
 *     summary: Get all orders for a specific delivery zone
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: zone
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery zone identifier
 *     responses:
 *       200:
 *         description: Zone orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Zone not found
 */
router.get('/zones/:zone/orders', verifyToken, logisticsController.getZoneOrders);

module.exports = router;
