const express = require('express');
const ctrl = require('../controllers/paymentMethodController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Customer access required' });
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Payment Methods
 *   description: Customer saved payment cards
 */

/**
 * @swagger
 * /payment-methods:
 *   get:
 *     summary: Get saved payment methods
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get('/', verifyCustomer, ctrl.getPaymentMethods);

/**
 * @swagger
 * /payment-methods:
 *   post:
 *     summary: Add a payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardType, last4, cardholderName, expiryMonth, expiryYear]
 *             properties:
 *               cardType:       { type: string, enum: [Visa, Mastercard, Meeza, Other] }
 *               last4:          { type: string, example: "9010" }
 *               cardholderName: { type: string, example: "AHMED ALI" }
 *               expiryMonth:    { type: string, example: "02" }
 *               expiryYear:     { type: string, example: "27" }
 *               isDefault:      { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Payment method added
 */
router.post('/', verifyCustomer, ctrl.addPaymentMethod);

/**
 * @swagger
 * /payment-methods/{id}:
 *   put:
 *     summary: Update a payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment method updated
 */
router.put('/:id', verifyCustomer, ctrl.updatePaymentMethod);

/**
 * @swagger
 * /payment-methods/{id}:
 *   delete:
 *     summary: Delete a payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment method deleted
 */
router.delete('/:id', verifyCustomer, ctrl.deletePaymentMethod);

/**
 * @swagger
 * /payment-methods/{id}/set-default:
 *   patch:
 *     summary: Set payment method as default
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Default payment method updated
 */
router.patch('/:id/set-default', verifyCustomer, ctrl.setDefaultPaymentMethod);

module.exports = router;
