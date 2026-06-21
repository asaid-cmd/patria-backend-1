const express = require('express');
const tableController = require('../controllers/tableController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Dining table management
 */

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, occupied, reserved, cleaning]
 *         description: Filter by table status
 *     responses:
 *       200:
 *         description: List of tables retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, tableController.getTables);

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Create a new dining table
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - capacity
 *               - locationId
 *             properties:
 *               number:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *               locationId:
 *                 type: string
 *               section:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Table created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       409:
 *         description: Table number already exists in this location
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.createTable);

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update table status or details
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved, cleaning]
 *               capacity:
 *                 type: integer
 *               section:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or CASHIER role
 *       404:
 *         description: Table not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), tableController.updateTableStatus);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete a dining table
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Table not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.deleteTable);

module.exports = router;
