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

// Dashboard admin routes
router.get('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.createUser);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.updateUser);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.deleteUser);

// Customer mobile app profile routes
router.get('/profile', verifyCustomer, customerAuthController.getProfile);
router.put('/profile', verifyCustomer, customerAuthController.updateProfile);
router.put('/password', verifyCustomer, customerAuthController.updatePassword);

// Loyalty
router.get('/loyalty', verifyCustomer, customerAuthController.getLoyalty);
router.post('/loyalty/checkout-preview', verifyCustomer, customerAuthController.loyaltyCheckoutPreview);

// Favorites
router.get('/favorites', verifyCustomer, customerAuthController.getFavorites);
router.post('/favorites/:productId', verifyCustomer, customerAuthController.addFavorite);
router.delete('/favorites/:productId', verifyCustomer, customerAuthController.removeFavorite);

// Addresses (set default - other address CRUD is in /api/v2/addresses)
router.patch('/addresses/:id/set-default', verifyCustomer, customerAuthController.setDefaultAddress);

module.exports = router;
