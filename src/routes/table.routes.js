const express = require('express');
const tableController = require('../controllers/tableController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Dining table management (Dashboard)
 */

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all dining tables with pagination
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [main_hall, terrace, vip, counter]
 *         description: Filter by section
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Table'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               data:
 *                 - _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   number: 1
 *                   capacity: 4
 *                   section: main_hall
 *                   status: available
 *                   createdAt: "2026-01-01T00:00:00.000Z"
 *                   updatedAt: "2026-01-01T00:00:00.000Z"
 *                   __v: 0
 *               pagination:
 *                 total: 20
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
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
 *             required: [number, capacity, section]
 *             properties:
 *               number:
 *                 type: integer
 *                 example: 5
 *                 description: Table number (unique per location)
 *               capacity:
 *                 type: integer
 *                 example: 4
 *                 description: Maximum number of guests
 *               section:
 *                 type: string
 *                 enum: [main_hall, terrace, vip, counter]
 *                 example: main_hall
 *     responses:
 *       201:
 *         description: Table created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 table:
 *                   $ref: '#/components/schemas/Table'
 *                 message:
 *                   type: string
 *                   example: Table created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       409:
 *         description: Table number already exists
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.createTable);

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update table status (available / occupied)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, occupied]
 *                 example: occupied
 *     responses:
 *       200:
 *         description: Table updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 table:
 *                   $ref: '#/components/schemas/Table'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN, MANAGER, or CASHIER role
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
 *         description: Table MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Table deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Table not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.deleteTable);

module.exports = router;
