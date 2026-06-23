const express = require('express');
const offerController = require('../controllers/offerController');
const { verifyToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Offers
 *   description: Promotional offer management
 */

/**
 * @swagger
 * /offers:
 *   get:
 *     summary: Get all promotional offers
 *     tags: [Offers]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of offers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /offers/active:
 *   get:
 *     summary: Get active offers (public — customer mobile app)
 *     tags: [Offers]
 *     responses:
 *       200:
 *         description: List of currently active promotional offers
 */
router.get('/active', offerController.getActiveOffers);

/**
 * @swagger
 * /offers/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *               orderTotal:
 *                 type: number
 *                 example: 300
 *     responses:
 *       200:
 *         description: Coupon valid — returns discount and new total
 *       400:
 *         description: Coupon expired or limit reached
 *       404:
 *         description: Invalid coupon code
 */
router.post('/validate', verifyToken, offerController.validateCoupon);

/**
 * @swagger
 * /offers:
 *   get:
 *     summary: Get all offers (Dashboard)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated offers list
 */
router.get('/', verifyToken, offerController.getOffers);

/**
 * @swagger
 * /offers:
 *   post:
 *     summary: Create a new promotional offer
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - discountType
 *               - discountValue
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.single('bannerImage'), offerController.createOffer);

/**
 * @swagger
 * /offers/{id}:
 *   put:
 *     summary: Update a promotional offer
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Offer not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.single('bannerImage'), offerController.updateOffer);

/**
 * @swagger
 * /offers/{id}/toggle:
 *   patch:
 *     summary: Toggle offer active status
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Offer not found
 */
router.patch('/:id/toggle', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), offerController.toggleOfferStatus);

/**
 * @swagger
 * /offers/{id}:
 *   delete:
 *     summary: Delete a promotional offer
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Offer not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), offerController.deleteOffer);

module.exports = router;
