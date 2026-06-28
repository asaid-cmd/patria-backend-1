const express = require('express');
const locationController = require('../controllers/locationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Delivery zone management (Dashboard). Each location is a delivery area with a fee and minimum order.
 */

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all delivery zones with stats
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of delivery zones + stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryZone'
 *                 stats:
 *                   $ref: '#/components/schemas/LocationStats'
 *             example:
 *               locations:
 *                 - _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   name: Downtown
 *                   deliveryFee: 15
 *                   minOrderAmount: 50
 *                   isActive: true
 *                   status: Active
 *                   createdAt: "2026-01-01T00:00:00.000Z"
 *                   updatedAt: "2026-01-01T00:00:00.000Z"
 *                   __v: 0
 *               stats:
 *                 total: 5
 *                 active: 4
 *                 inactive: 1
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, locationController.getLocations);

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a new delivery zone
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maadi
 *               deliveryFee:
 *                 type: number
 *                 example: 20
 *                 description: Delivery fee in EGP
 *               minOrderAmount:
 *                 type: number
 *                 example: 100
 *                 description: Minimum order amount in EGP
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Delivery zone created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   $ref: '#/components/schemas/DeliveryZone'
 *                 message:
 *                   type: string
 *                   example: Delivery zone created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN, SUPER_ADMIN, or MANAGER role
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.createLocation);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Update a delivery zone
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery zone MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maadi Updated
 *               deliveryFee:
 *                 type: number
 *                 example: 25
 *               minOrderAmount:
 *                 type: number
 *                 example: 120
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Delivery zone updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   $ref: '#/components/schemas/DeliveryZone'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN, SUPER_ADMIN, or MANAGER role
 *       404:
 *         description: Location not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.updateLocation);

/**
 * @swagger
 * /locations/{id}/toggle:
 *   patch:
 *     summary: Toggle delivery zone active/inactive status
 *     description: |
 *       Pass `{ "isActive": true }` to activate or `{ "isActive": false }` to deactivate.
 *       If `isActive` is omitted, the status is flipped (toggled).
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery zone MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: Explicit target state. Omit to auto-toggle.
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   $ref: '#/components/schemas/DeliveryZone'
 *                 message:
 *                   type: string
 *                   example: Status updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN, SUPER_ADMIN, or MANAGER role
 *       404:
 *         description: Location not found
 */
router.patch('/:id/toggle', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.toggleStatus);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Delete a delivery zone
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery zone MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Delivery zone deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delivery zone deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or SUPER_ADMIN role
 *       404:
 *         description: Location not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), locationController.deleteLocation);

module.exports = router;
