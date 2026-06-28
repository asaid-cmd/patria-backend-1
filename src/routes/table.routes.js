const express = require('express');
const tableController = require('../controllers/tableController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: |
 *     Dining table management (Dashboard).
 *
 *     **Table sections:** `main_hall` | `terrace` | `vip` | `counter`
 *
 *     **Table status:** `available` | `occupied`
 *
 *     List endpoints return paginated results: `{ data: [...], pagination: {...} }`
 *
 *     **All endpoints require authentication.**
 */

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all dining tables (paginated)
 *     description: |
 *       Returns a paginated list of tables. Supports filtering by `section` or `locationId`.
 *
 *       **Response format:**
 *       ```json
 *       {
 *         "data": [ { ...table objects... } ],
 *         "pagination": { "total": 20, "page": 1, "limit": 10, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
 *       }
 *       ```
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [main_hall, terrace, vip, counter]
 *         description: Filter tables by section
 *         example: main_hall
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location (branch) ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Items per page (default 10, max 100)
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
 *                   section: "main_hall"
 *                   status: "available"
 *                   createdAt: "2026-01-01T00:00:00.000Z"
 *                   updatedAt: "2026-01-01T00:00:00.000Z"
 *                   __v: 0
 *                 - _id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   number: 2
 *                   capacity: 2
 *                   section: "terrace"
 *                   status: "occupied"
 *                   createdAt: "2026-01-01T00:00:00.000Z"
 *                   updatedAt: "2026-06-28T19:30:00.000Z"
 *                   __v: 0
 *               pagination:
 *                 total: 20
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 2
 *                 hasNextPage: true
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
 *     description: |
 *       Creates a new table. `number` must be unique (within the same location if `locationId` is used).
 *
 *       **Response format:**
 *       ```json
 *       { "table": { ...table object... }, "message": "Table created" }
 *       ```
 *
 *       **Roles required:** ADMIN or MANAGER
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
 *               - section
 *             properties:
 *               number:
 *                 type: integer
 *                 description: Table number (must be unique)
 *                 example: 5
 *               capacity:
 *                 type: integer
 *                 description: Maximum number of seats
 *                 example: 4
 *               section:
 *                 type: string
 *                 enum: [main_hall, terrace, vip, counter]
 *                 description: Location area of the table
 *                 example: main_hall
 *           example:
 *             number: 5
 *             capacity: 4
 *             section: "main_hall"
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
 *             example:
 *               table:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 number: 5
 *                 capacity: 4
 *                 section: "main_hall"
 *                 status: "available"
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T10:00:00.000Z"
 *                 __v: 0
 *               message: "Table created"
 *       400:
 *         description: Validation error — missing required fields
 *         content:
 *           application/json:
 *             example:
 *               message: "\"number\" is required"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       409:
 *         description: Table number already exists
 *         content:
 *           application/json:
 *             example:
 *               message: "E11000 duplicate key error"
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.createTable);

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update table status (available / occupied)
 *     description: |
 *       Updates the status of a table. Dashboard uses this to mark tables as occupied or free.
 *
 *       **Status values:**
 *       - `"available"` — table is free
 *       - `"occupied"` — table has guests
 *
 *       **Response format:**
 *       ```json
 *       { "table": { ...updated table object... } }
 *       ```
 *
 *       **Roles required:** ADMIN, MANAGER, or CASHIER
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, occupied]
 *                 description: New table status
 *           examples:
 *             mark_occupied:
 *               summary: Mark table as occupied
 *               value:
 *                 status: "occupied"
 *             mark_available:
 *               summary: Mark table as available (free)
 *               value:
 *                 status: "available"
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
 *             example:
 *               table:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 number: 1
 *                 capacity: 4
 *                 section: "main_hall"
 *                 status: "occupied"
 *                 createdAt: "2026-01-01T00:00:00.000Z"
 *                 updatedAt: "2026-06-28T19:30:00.000Z"
 *                 __v: 0
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN, MANAGER, or CASHIER role
 *       404:
 *         description: Table not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Table not found"
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), tableController.updateTableStatus);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Permanently delete a dining table
 *     description: |
 *       Permanently removes the table from the database.
 *
 *       **Response format:**
 *       ```json
 *       { "message": "Table deleted" }
 *       ```
 *
 *       **Roles required:** ADMIN or MANAGER
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
 *             example:
 *               message: "Table deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Table not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Table not found"
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.deleteTable);

module.exports = router;
