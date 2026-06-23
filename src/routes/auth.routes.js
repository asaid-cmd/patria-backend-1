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
 * /auth/register:
 *   post:
 *     summary: Register customer (mobile app)
 *     tags: [Auth]
 */
router.post('/register', customerAuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login - customer (phone) or staff (email)
 *     tags: [Auth]
 */
router.post('/login', (req, res, next) => {
  if (req.body.phone && !req.body.email) {
    return customerAuthController.login(req, res, next);
  }
  return authController.login(req, res, next);
});

// Dashboard staff-only routes
router.post('/admin/register', authController.register);
router.post('/admin/login', authController.login);

// Common token routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.me);

// Customer mobile app auth routes
router.post('/send-verification', customerAuthController.sendVerification);
router.post('/verify-phone', customerAuthController.verifyPhone);
router.post('/forgot-password', customerAuthController.forgotPassword);
router.post('/reset-password', customerAuthController.resetPassword);
router.post('/oauth/login', customerAuthController.oauthLogin);
router.put('/change-password', verifyCustomer, customerAuthController.changePassword);

module.exports = router;
