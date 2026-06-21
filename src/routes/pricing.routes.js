const express = require('express');
const pricingController = require('../controllers/pricingController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Pricing rules and price list management
 */

/**
 * @swagger
 * /pricing:
 *   get:
 *     summary: Get all pricing rules
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pricing rules retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, pricingController.getPricingRules);

/**
 * @swagger
 * /pricing/rules:
 *   post:
 *     summary: Create a new pricing rule
 *     tags: [Pricing]
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
 *               - value
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed, multiplier]
 *               value:
 *                 type: number
 *               conditions:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Pricing rule created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/rules', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.createPricingRule);

/**
 * @swagger
 * /pricing/rules/{id}:
 *   put:
 *     summary: Update a pricing rule
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing rule ID
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
 *                 enum: [percentage, fixed, multiplier]
 *               value:
 *                 type: number
 *               conditions:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing rule updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Pricing rule not found
 */
router.put('/rules/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.updatePricingRule);

/**
 * @swagger
 * /pricing/rules/{id}:
 *   delete:
 *     summary: Delete a pricing rule
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing rule ID
 *     responses:
 *       200:
 *         description: Pricing rule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Pricing rule not found
 */
router.delete('/rules/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.deletePricingRule);

/**
 * @swagger
 * /pricing/pricelists:
 *   get:
 *     summary: Get all price lists
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of price lists retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/pricelists', verifyToken, pricingController.getPriceLists);

/**
 * @swagger
 * /pricing/pricelists:
 *   post:
 *     summary: Create a new price list
 *     tags: [Pricing]
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
 *               description:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Price list created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 */
router.post('/pricelists', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.createPriceList);

/**
 * @swagger
 * /pricing/pricelists/{id}:
 *   put:
 *     summary: Update a price list
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price list ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Price list updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Price list not found
 */
router.put('/pricelists/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.updatePriceList);

/**
 * @swagger
 * /pricing/pricelists/{id}:
 *   delete:
 *     summary: Delete a price list
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price list ID
 *     responses:
 *       200:
 *         description: Price list deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or MANAGER role
 *       404:
 *         description: Price list not found
 */
router.delete('/pricelists/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.deletePriceList);

module.exports = router;
