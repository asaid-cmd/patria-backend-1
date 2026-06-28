const express = require('express');
const reservationController = require('../controllers/reservationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: |
 *     Table reservation management (Dashboard).
 *
 *     **Reservation status flow:**
 *     ```
 *     on_hold → confirmed → sitting → ended
 *     (any status) → cancelled
 *     ```
 *
 *     **Status values:** `on_hold` | `confirmed` | `sitting` | `ended` | `cancelled`
 *
 *     List endpoints return paginated results with the `tableId` field populated (full table object).
 *
 *     **All endpoints require authentication.**
 */

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations (paginated, filterable by date)
 *     description: |
 *       Returns a paginated list of reservations. The `tableId` field is populated with the full table object.
 *
 *       **Use `?date=YYYY-MM-DD` to filter reservations for a specific day.**
 *
 *       **Response format:**
 *       ```json
 *       {
 *         "data": [ { ...reservation with populated tableId... } ],
 *         "pagination": { "total": 10, "page": 1, "limit": 10, "totalPages": 1, ... }
 *       }
 *       ```
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
 *         description: |
 *           Filter reservations for a specific date (YYYY-MM-DD).
 *           Matches all reservations from 00:00:00 to 23:59:59 of that day.
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
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
 *                   customerName: "Ahmed Said"
 *                   phone: "01012345678"
 *                   customerEmail: "ahmed@example.com"
 *                   numberOfPeople: 4
 *                   date: "2026-06-28T00:00:00.000Z"
 *                   time: "19:00"
 *                   tableId:
 *                     _id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                     number: 5
 *                     capacity: 6
 *                     section: "vip"
 *                     status: "available"
 *                     createdAt: "2026-01-01T00:00:00.000Z"
 *                     updatedAt: "2026-01-01T00:00:00.000Z"
 *                     __v: 0
 *                   status: "on_hold"
 *                   createdAt: "2026-06-28T10:00:00.000Z"
 *                   updatedAt: "2026-06-28T10:00:00.000Z"
 *                   __v: 0
 *               pagination:
 *                 total: 1
 *                 page: 1
 *                 limit: 10
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
 *     description: |
 *       Creates a new reservation. The default status is `on_hold`.
 *       The `tableId` in the response is populated with the full table object.
 *
 *       **Response format:**
 *       ```json
 *       { "reservation": { ...reservation with populated tableId... }, "message": "Reservation created" }
 *       ```
 *
 *       **Required fields:** `customerName`, `phone`, `numberOfPeople`, `date`, `time`
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - phone
 *               - numberOfPeople
 *               - date
 *               - time
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Full name of the customer
 *                 example: "Ahmed Said"
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *                 example: "01012345678"
 *               customerEmail:
 *                 type: string
 *                 description: Customer email (optional)
 *                 example: "ahmed@example.com"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Reservation date (YYYY-MM-DD)
 *                 example: "2026-06-28"
 *               time:
 *                 type: string
 *                 description: Reservation time (HH:MM — 24h format)
 *                 pattern: '^\d{2}:\d{2}$'
 *                 example: "19:00"
 *               numberOfPeople:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of guests
 *                 example: 4
 *               tableId:
 *                 type: string
 *                 description: MongoDB ObjectId of the table to reserve (optional)
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d2"
 *           example:
 *             customerName: "Ahmed Said"
 *             phone: "01012345678"
 *             customerEmail: "ahmed@example.com"
 *             date: "2026-06-28"
 *             time: "19:00"
 *             numberOfPeople: 4
 *             tableId: "64f1a2b3c4d5e6f7a8b9c0d2"
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
 *             example:
 *               reservation:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 customerName: "Ahmed Said"
 *                 phone: "01012345678"
 *                 customerEmail: "ahmed@example.com"
 *                 numberOfPeople: 4
 *                 date: "2026-06-28T00:00:00.000Z"
 *                 time: "19:00"
 *                 tableId:
 *                   _id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   number: 5
 *                   capacity: 6
 *                   section: "vip"
 *                   status: "available"
 *                   createdAt: "2026-01-01T00:00:00.000Z"
 *                   updatedAt: "2026-01-01T00:00:00.000Z"
 *                   __v: 0
 *                 status: "on_hold"
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T10:00:00.000Z"
 *                 __v: 0
 *               message: "Reservation created"
 *       400:
 *         description: Validation error — missing required fields or invalid time format
 *         content:
 *           application/json:
 *             example:
 *               message: "\"numberOfPeople\" must be a number"
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyToken, reservationController.createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Update reservation status
 *     description: |
 *       Updates the status of an existing reservation.
 *
 *       **Status flow:**
 *       ```
 *       on_hold → confirmed → sitting → ended
 *       (any) → cancelled
 *       ```
 *
 *       **Response format:**
 *       ```json
 *       { "reservation": { ...updated reservation object... } }
 *       ```
 *
 *       **Roles required:** ADMIN or MANAGER
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [on_hold, confirmed, sitting, ended, cancelled]
 *                 description: New reservation status
 *           examples:
 *             confirm:
 *               summary: Confirm the reservation
 *               value:
 *                 status: "confirmed"
 *             seat:
 *               summary: Customer arrived — mark as sitting
 *               value:
 *                 status: "sitting"
 *             end:
 *               summary: Reservation completed
 *               value:
 *                 status: "ended"
 *             cancel:
 *               summary: Cancel the reservation
 *               value:
 *                 status: "cancelled"
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
 *             example:
 *               reservation:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 customerName: "Ahmed Said"
 *                 phone: "01012345678"
 *                 numberOfPeople: 4
 *                 date: "2026-06-28T00:00:00.000Z"
 *                 time: "19:00"
 *                 tableId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 status: "confirmed"
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T11:00:00.000Z"
 *                 __v: 0
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Reservation not found"
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reservationController.updateReservationStatus);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Permanently delete a reservation
 *     description: |
 *       Permanently removes the reservation from the database.
 *
 *       **Response format:**
 *       ```json
 *       { "message": "Reservation deleted" }
 *       ```
 *
 *       **Roles required:** ADMIN or MANAGER
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
 *             example:
 *               message: "Reservation deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Reservation not found"
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reservationController.deleteReservation);

module.exports = router;
