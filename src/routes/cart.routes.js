const express = require('express');
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Customer shopping cart
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get customer cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /cart/to-order-items:
 *   get:
 *     summary: Convert cart items to order format
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order items returned
 */
router.get('/to-order-items', cartController.cartToOrderItems);

/**
 * @swagger
 * /cart/item/{itemId}:
 *   get:
 *     summary: Get single cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart item returned
 */
router.get('/item/:itemId', cartController.getCartItem);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
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
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               customization:
 *                 type: object
 *                 example: { roastLevel: "Medium", grindType: "Fine" }
 *               selectedVariants:
 *                 type: array
 *                 items:
 *                   type: object
 *               selectedExtras:
 *                 type: array
 *                 items:
 *                   type: object
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item added to cart
 */
router.post('/add', cartController.addToCart);

/**
 * @swagger
 * /cart/update/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/update/:itemId', cartController.updateCartItem);

/**
 * @swagger
 * /cart/remove/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/remove/:itemId', cartController.removeCartItem);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear all cart items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/clear', cartController.clearCart);

module.exports = router;
