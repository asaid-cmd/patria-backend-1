const express = require('express');
const shiftController = require('../controllers/shiftController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: POS shift management
 */

/**
 * @swagger
 * /pos/shifts/open:
 *   post:
 *     summary: Open a new POS shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openingCash
 *             properties:
 *               openingCash:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shift opened successfully
 *       400:
 *         description: Validation error or shift already open
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires CASHIER, ADMIN, or MANAGER role
 */
router.post('/shifts/open', verifyToken, authorize(ROLES.CASHIER, ROLES.ADMIN, ROLES.MANAGER), shiftController.openShift);

/**
 * @swagger
 * /pos/shifts/close:
 *   put:
 *     summary: Close the current POS shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - closingCash
 *             properties:
 *               closingCash:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift closed successfully
 *       400:
 *         description: Validation error or no open shift found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires CASHIER, ADMIN, or MANAGER role
 */
router.put('/shifts/close', verifyToken, authorize(ROLES.CASHIER, ROLES.ADMIN, ROLES.MANAGER), shiftController.closeShift);

/**
 * @swagger
 * /pos/shifts/current:
 *   get:
 *     summary: Get the current open shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current shift retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No open shift found
 */
router.get('/shifts/current', verifyToken, shiftController.getCurrentShift);

/**
 * @swagger
 * /pos/shifts/{shiftId}:
 *   get:
 *     summary: Get shift summary by ID
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 */
router.get('/shifts/:shiftId', verifyToken, shiftController.getShiftSummary);

module.exports = router;
