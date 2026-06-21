const express = require('express');
const productionController = require('../controllers/productionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Production
 *   description: Production batch and equipment management
 */

// Batches

/**
 * @swagger
 * /production/batches:
 *   get:
 *     summary: Get all production batches
 *     tags: [Production]
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
 *         description: Filter by batch status
 *     responses:
 *       200:
 *         description: List of production batches retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/batches', verifyToken, productionController.getBatches);

/**
 * @swagger
 * /production/batches:
 *   post:
 *     summary: Create a new production batch
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Production batch created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/batches', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.createBatch);

/**
 * @swagger
 * /production/batches/{id}/quality-check:
 *   post:
 *     summary: Perform quality check on a production batch
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passed
 *             properties:
 *               passed:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               checkedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quality check recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Batch not found
 */
router.post('/batches/:id/quality-check', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.verifyQuality);

/**
 * @swagger
 * /production/batches/{id}/status:
 *   patch:
 *     summary: Update production batch status
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
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
 *                 enum: [planned, in-progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Batch status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Batch not found
 */
router.patch('/batches/:id/status', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.updateBatchStatus);

// Equipment

/**
 * @swagger
 * /production/equipment:
 *   get:
 *     summary: Get all production equipment
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of equipment retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/equipment', verifyToken, productionController.getEquipment);

/**
 * @swagger
 * /production/equipment:
 *   post:
 *     summary: Add new production equipment
 *     tags: [Production]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               nextServiceDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Equipment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/equipment', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.createEquipment);

/**
 * @swagger
 * /production/equipment/{id}:
 *   put:
 *     summary: Update production equipment details
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               nextServiceDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [active, maintenance, retired]
 *     responses:
 *       200:
 *         description: Equipment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Equipment not found
 */
router.put('/equipment/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.updateEquipment);

/**
 * @swagger
 * /production/equipment/{id}/service-log:
 *   post:
 *     summary: Log a service entry for production equipment
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - serviceDate
 *             properties:
 *               description:
 *                 type: string
 *               serviceDate:
 *                 type: string
 *                 format: date
 *               technician:
 *                 type: string
 *               cost:
 *                 type: number
 *               nextServiceDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Service log entry added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Equipment not found
 */
router.post('/equipment/:id/service-log', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.logEquipmentService);

/**
 * @swagger
 * /production/equipment/{id}/service-logs:
 *   get:
 *     summary: Get all service logs for production equipment
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *     responses:
 *       200:
 *         description: Equipment service logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Equipment not found
 */
router.get('/equipment/:id/service-logs', verifyToken, productionController.getEquipmentServiceLogs);

module.exports = router;
