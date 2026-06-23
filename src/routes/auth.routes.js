const express = require('express');
const authController = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');
const { verifyToken } = require('../middleware/auth');

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
 *   name: Auth
 *   description: Customer mobile app — phone-based authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed Said
 *               email:
 *                 type: string
 *                 example: ahmed@example.com
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Customer registered — returns token
 *       409:
 *         description: Phone already registered
 */
router.post('/register', customerAuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login — customer (phone) or staff (email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - title: Customer Login (phone)
 *                 type: object
 *                 required: [phone, password]
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "01012345678"
 *                   password:
 *                     type: string
 *               - title: Staff Login (email)
 *                 type: object
 *                 required: [email, password]
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: admin@patria.com
 *                   password:
 *                     type: string
 *     responses:
 *       200:
 *         description: Login successful — returns token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res, next) => {
  if (req.body.phone && !req.body.email) {
    return customerAuthController.login(req, res, next);
  }
  return authController.login(req, res, next);
});

/**
 * @swagger
 * tags:
 *   name: Auth — Dashboard
 *   description: Staff/Admin email-based login
 */

/**
 * @swagger
 * /auth/admin/register:
 *   post:
 *     summary: Register admin/staff user
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff user created
 */
router.post('/admin/register', authController.register);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Staff login with email
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken + refreshToken
 */
router.post('/admin/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth — Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current staff user
 *     tags: [Auth — Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', verifyToken, authController.me);

/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: Send OTP to customer phone
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *     responses:
 *       200:
 *         description: OTP sent (returned in response for testing)
 */
router.post('/send-verification', customerAuthController.sendVerification);

/**
 * @swagger
 * /auth/verify-phone:
 *   post:
 *     summary: Verify customer phone with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "1234"
 *               fcmToken:
 *                 type: string
 *                 description: Optional FCM token to register on verify
 *     responses:
 *       200:
 *         description: Phone verified — returns token
 */
router.post('/verify-phone', customerAuthController.verifyPhone);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent if phone exists
 */
router.post('/forgot-password', customerAuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code, newPassword]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', customerAuthController.resetPassword);

/**
 * @swagger
 * /auth/oauth/login:
 *   post:
 *     summary: Google OAuth login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from Firebase Auth
 *     responses:
 *       501:
 *         description: Requires firebase-admin configuration
 */
router.post('/oauth/login', customerAuthController.oauthLogin);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change customer password (authenticated)
 *     tags: [Auth]
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
 *         description: Password changed
 */
router.put('/change-password', verifyCustomer, customerAuthController.changePassword);

module.exports = router;
