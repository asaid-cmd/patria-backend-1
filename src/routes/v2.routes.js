const express = require('express');
const { verifyToken } = require('../middleware/auth');
const customerAuthController = require('../controllers/customerAuthController');
const notificationController = require('../controllers/notificationController');
const customerSearchController = require('../controllers/customerSearchController');
const zoneController = require('../controllers/zoneController');
const orderController = require('../controllers/orderController');

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

// Addresses
router.get('/addresses', verifyCustomer, customerAuthController.getAddresses);
router.post('/addresses', verifyCustomer, customerAuthController.addAddress);
router.put('/addresses/:addressId', verifyCustomer, customerAuthController.updateAddress);
router.delete('/addresses/:addressId', verifyCustomer, customerAuthController.deleteAddress);

// Notifications (customer)
router.post('/notifications/device', verifyCustomer, notificationController.registerDeviceToken);
router.delete('/notifications/device', verifyCustomer, notificationController.unregisterDeviceToken);
router.get('/notifications', verifyCustomer, notificationController.getCustomerNotifications);
router.get('/notifications/unread-count', verifyCustomer, notificationController.getUnreadCount);
router.patch('/notifications/read-all', verifyCustomer, notificationController.markAllRead);
router.patch('/notifications/:id/read', verifyCustomer, notificationController.markOneRead);

// Customer search
router.post('/customer-search/log', verifyCustomer, customerSearchController.logSearch);
router.get('/customer-search/last', verifyCustomer, customerSearchController.getLastSearch);
router.get('/customer-search/trending', customerSearchController.getTrending);
router.get('/customer-search/history', verifyCustomer, customerSearchController.getHistory);
router.delete('/customer-search/history', verifyCustomer, customerSearchController.clearHistory);

// Zones
router.get('/zones', zoneController.getZones);
router.get('/zones/lookup', zoneController.lookupZone);

// Orders v2 (live tracking + customer location)
router.get('/orders/:orderId/tracking', orderController.getOrderTracking);
router.patch('/orders/:orderId/customer-location', verifyCustomer, orderController.saveCustomerLocation);

module.exports = router;
