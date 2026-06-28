const express = require('express');
const zoneController = require('../controllers/zoneController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Zones
 *   description: Delivery zones management
 */

/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Get all active delivery zones (public)
 *     tags: [Zones]
 *     responses:
 *       200:
 *         description: List of zones with delivery fees and estimated delivery time
 */
router.get('/', zoneController.getZones);

/**
 * @swagger
 * /zones/lookup:
 *   get:
 *     summary: Find zone by GPS coordinates (public)
 *     tags: [Zones]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Zone found
 *       404:
 *         description: No zone for this location
 */
router.get('/lookup', zoneController.lookupZone);

/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Create delivery zone (Admin/Manager)
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, deliveryFee]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alexandria — Sidi Gaber"
 *               nameAr:
 *                 type: string
 *                 example: "Alexandria — Sidi Gaber"
 *               deliveryFee:
 *                 type: number
 *                 example: 25
 *               minOrder:
 *                 type: number
 *                 example: 100
 *               estimatedMinutes:
 *                 type: integer
 *                 example: 45
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               polygon:
 *                 type: array
 *                 description: Array of [lat, lng] pairs defining the zone boundary
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *     responses:
 *       201:
 *         description: Zone created
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), zoneController.createZone);

/**
 * @swagger
 * /zones/{id}:
 *   put:
 *     summary: Update delivery zone
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               deliveryFee:
 *                 type: number
 *               minOrder:
 *                 type: number
 *               estimatedMinutes:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Zone updated — mobile app sees changes instantly
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), zoneController.updateZone);

/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Delete delivery zone
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zone deleted
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), zoneController.deleteZone);

module.exports = router;
