const express = require('express');
const userController = require('../controllers/userController');
const customerAuthController = require('../controllers/customerAuthController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'customer') {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Customer access required', 403);
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Dashboard staff management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all staff users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create staff user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, cashier, kitchen, staff]
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update staff user
 *     tags: [Users]
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
 *         description: User updated
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete staff user
 *     tags: [Users]
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
 *         description: User deleted
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.deleteUser);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Customer profile, loyalty points, favorites
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile data
 */
router.get('/profile', verifyCustomer, customerAuthController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', verifyCustomer, customerAuthController.updateProfile);

/**
 * @swagger
 * /users/password:
 *   put:
 *     summary: Update customer password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.put('/password', verifyCustomer, customerAuthController.updatePassword);

/**
 * @swagger
 * /users/loyalty:
 *   get:
 *     summary: Get customer loyalty points and tier
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty points, tier, and next tier info
 */
router.get('/loyalty', verifyCustomer, customerAuthController.getLoyalty);

/**
 * @swagger
 * /users/loyalty/checkout-preview:
 *   post:
 *     summary: Preview loyalty points redemption discount
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pointsToRedeem, orderTotal]
 *             properties:
 *               pointsToRedeem:
 *                 type: integer
 *                 example: 100
 *               orderTotal:
 *                 type: number
 *                 example: 250
 *     responses:
 *       200:
 *         description: Discount amount and new total
 */
router.post('/loyalty/checkout-preview', verifyCustomer, customerAuthController.loyaltyCheckoutPreview);

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Get customer favorite products
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite products
 */
router.get('/favorites', verifyCustomer, customerAuthController.getFavorites);

/**
 * @swagger
 * /users/favorites/{productId}:
 *   post:
 *     summary: Add product to favorites
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Added to favorites
 */
router.post('/favorites/:productId', verifyCustomer, customerAuthController.addFavorite);

/**
 * @swagger
 * /users/favorites/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed from favorites
 */
router.delete('/favorites/:productId', verifyCustomer, customerAuthController.removeFavorite);

/**
 * @swagger
 * /users/addresses:
 *   get:
 *     summary: Get all saved addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved addresses
 */
router.get('/addresses', verifyCustomer, customerAuthController.getAddresses);

/**
 * @swagger
 * /users/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Address added
 */
router.post('/addresses', verifyCustomer, customerAuthController.addAddress);

/**
 * @swagger
 * /users/addresses/{id}:
 *   put:
 *     summary: Update address
 *     tags: [Addresses]
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
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       200:
 *         description: Address updated
 */
router.put('/addresses/:addressId', verifyCustomer, customerAuthController.updateAddress);

/**
 * @swagger
 * /users/addresses/{id}:
 *   delete:
 *     summary: Delete address
 *     tags: [Addresses]
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
 *         description: Address deleted
 */
router.delete('/addresses/:addressId', verifyCustomer, customerAuthController.deleteAddress);

/**
 * @swagger
 * /users/addresses/{id}/set-default:
 *   patch:
 *     summary: Set address as default
 *     tags: [Addresses]
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
 *         description: Default address updated
 */
router.patch('/addresses/:id/set-default', verifyCustomer, customerAuthController.setDefaultAddress);

module.exports = router;
