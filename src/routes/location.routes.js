const express = require('express');
const locationController = require('../controllers/locationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: |
 *     Delivery zone management (Dashboard).
 *
 *     Each "location" is a **delivery zone** with a delivery fee and minimum order amount.
 *     The `status` field (`"Active"` / `"Inactive"`) is computed from `isActive` automatically.
 *
 *     **All endpoints require authentication (Bearer token).**
 */

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all delivery zones with summary stats
 *     description: |
 *       Returns all delivery zones (active and inactive) plus statistics.
 *
 *       **Response format:**
 *       ```json
 *       {
 *         "locations": [ { ...zone objects... } ],
 *         "stats": { "total": 5, "active": 4, "inactive": 1 }
 *       }
 *       ```
 *
 *       Each zone has a computed `status` field: `"Active"` if `isActive=true`, `"Inactive"` if false.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all delivery zones + stats
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
 *                   name: "Downtown"
 *                   deliveryFee: 15
 *                   minOrderAmount: 50
 *                   isActive: true
 *                   status: "Active"
 *                   createdAt: "2026-01-01T00:00:00.000Z"
 *                   updatedAt: "2026-01-01T00:00:00.000Z"
 *                   __v: 0
 *                 - _id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   name: "Maadi"
 *                   deliveryFee: 20
 *                   minOrderAmount: 100
 *                   isActive: false
 *                   status: "Inactive"
 *                   createdAt: "2026-01-05T00:00:00.000Z"
 *                   updatedAt: "2026-02-01T00:00:00.000Z"
 *                   __v: 0
 *               stats:
 *                 total: 2
 *                 active: 1
 *                 inactive: 1
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized"
 */
router.get('/', verifyToken, locationController.getLocations);

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a new delivery zone
 *     description: |
 *       Creates a new delivery zone. Only `name` is required.
 *
 *       **Response format:**
 *       ```json
 *       { "location": { ...zone object... }, "message": "Delivery zone created" }
 *       ```
 *
 *       **Roles required:** ADMIN, SUPER_ADMIN, or MANAGER
 *     tags: [Locations]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Zone display name
 *                 example: Heliopolis
 *               deliveryFee:
 *                 type: number
 *                 description: Delivery fee in EGP (default 0)
 *                 example: 25
 *               minOrderAmount:
 *                 type: number
 *                 description: Minimum order amount in EGP (default 0)
 *                 example: 150
 *               isActive:
 *                 type: boolean
 *                 description: Whether this zone is accepting orders (default true)
 *                 example: true
 *           example:
 *             name: "Heliopolis"
 *             deliveryFee: 25
 *             minOrderAmount: 150
 *             isActive: true
 *     responses:
 *       201:
 *         description: Delivery zone created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   $ref: '#/components/schemas/DeliveryZone'
 *                 message:
 *                   type: string
 *             example:
 *               location:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Heliopolis"
 *                 deliveryFee: 25
 *                 minOrderAmount: 150
 *                 isActive: true
 *                 status: "Active"
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T10:00:00.000Z"
 *                 __v: 0
 *               message: "Delivery zone created"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "\"name\" is required"
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
 *     description: |
 *       Updates one or more fields of an existing delivery zone. Send only the fields you want to change.
 *
 *       **Response format:**
 *       ```json
 *       { "location": { ...updated zone object... } }
 *       ```
 *
 *       **Roles required:** ADMIN, SUPER_ADMIN, or MANAGER
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
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Downtown Updated"
 *               deliveryFee:
 *                 type: number
 *                 example: 18
 *               minOrderAmount:
 *                 type: number
 *                 example: 75
 *               isActive:
 *                 type: boolean
 *                 example: true
 *           example:
 *             name: "Downtown Updated"
 *             deliveryFee: 18
 *             minOrderAmount: 75
 *     responses:
 *       200:
 *         description: Delivery zone updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   $ref: '#/components/schemas/DeliveryZone'
 *             example:
 *               location:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Downtown Updated"
 *                 deliveryFee: 18
 *                 minOrderAmount: 75
 *                 isActive: true
 *                 status: "Active"
 *                 createdAt: "2026-01-01T00:00:00.000Z"
 *                 updatedAt: "2026-06-28T12:00:00.000Z"
 *                 __v: 0
 *       400:
 *         description: Validation error or empty body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN, SUPER_ADMIN, or MANAGER role
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Location not found"
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.updateLocation);

/**
 * @swagger
 * /locations/{id}/toggle:
 *   patch:
 *     summary: Toggle delivery zone active/inactive status
 *     description: |
 *       Activates or deactivates a delivery zone.
 *
 *       **Two modes:**
 *       - Send `{ "isActive": false }` → explicitly deactivate
 *       - Send `{ "isActive": true }` → explicitly activate
 *       - Omit body → auto-toggle (flips current state)
 *
 *       **Response format:**
 *       ```json
 *       { "location": { ...updated zone with new status... }, "message": "Status updated" }
 *       ```
 *
 *       **Roles required:** ADMIN, SUPER_ADMIN, or MANAGER
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
 *                 description: Explicit target state. Omit body to auto-toggle.
 *           examples:
 *             deactivate:
 *               summary: Deactivate zone
 *               value:
 *                 isActive: false
 *             activate:
 *               summary: Activate zone
 *               value:
 *                 isActive: true
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
 *             example:
 *               location:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Downtown"
 *                 deliveryFee: 15
 *                 minOrderAmount: 50
 *                 isActive: false
 *                 status: "Inactive"
 *                 createdAt: "2026-01-01T00:00:00.000Z"
 *                 updatedAt: "2026-06-28T12:00:00.000Z"
 *                 __v: 0
 *               message: "Status updated"
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
 *     summary: Permanently delete a delivery zone
 *     description: |
 *       Permanently removes the delivery zone from the database.
 *
 *       **Response format:**
 *       ```json
 *       { "message": "Delivery zone deleted" }
 *       ```
 *
 *       **Roles required:** ADMIN or SUPER_ADMIN
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
 *         description: Delivery zone deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Delivery zone deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or SUPER_ADMIN role
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Location not found"
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), locationController.deleteLocation);

module.exports = router;
