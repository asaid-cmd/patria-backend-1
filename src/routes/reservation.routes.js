const express = require('express');
const reservationController = require('../controllers/reservationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Table reservation management (Dashboard)
 */

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations (with optional date filter)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-06-28"
 *         description: Filter by reservation date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [on_hold, confirmed, sitting, ended, cancelled]
 *         description: Filter by reservation status
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
 *         description: Paginated list of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               data:
 *                 - _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   customerName: Ahmed Said
 *                   phone: "01012345678"
 *                   customerEmail: ahmed@example.com
 *                   numberOfPeople: 4
 *                   date: "2026-06-28T00:00:00.000Z"
 *                   time: "19:00"
 *                   tableId:
 *                     _id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                     number: 5
 *                     capacity: 6
 *                     section: vip
 *                     status: available
 *                   status: on_hold
 *                   createdAt: "2026-06-28T10:00:00.000Z"
 *                   updatedAt: "2026-06-28T10:00:00.000Z"
 *                   __v: 0
 *               pagination:
 *                 total: 10
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, reservationController.getReservations);

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new table reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, phone, numberOfPeople, date, time]
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: Ahmed Said
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               customerEmail:
 *                 type: string
 *                 example: ahmed@example.com
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-28"
 *               time:
 *                 type: string
 *                 pattern: '^\d{2}:\d{2}$'
 *                 example: "19:00"
 *               numberOfPeople:
 *                 type: integer
 *                 minimum: 1
 *                 example: 4
 *               tableId:
 *                 type: string
 *                 description: MongoDB ObjectId of the table to reserve
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d2"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *                 message:
 *                   type: string
 *                   example: Reservation created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyToken, reservationController.createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Update reservation status
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation MongoDB ObjectId
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
 *                 enum: [on_hold, confirmed, sitting, ended, cancelled]
 *                 example: confirmed
 *                 description: |
 *                   Reservation status flow:
 *                   on_hold → confirmed → sitting → ended
 *                   Any status → cancelled
 *     responses:
 *       200:
 *         description: Reservation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Reservation not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reservationController.updateReservationStatus);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Delete a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Reservation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reservation deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Reservation not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reservationController.deleteReservation);

module.exports = router;
