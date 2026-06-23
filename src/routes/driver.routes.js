const express = require('express');
const driverController = require('../controllers/driverController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const verifyDriver = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'driver') {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Driver access required', 403);
    }
    next();
  });
};

router.post('/login', driverController.login);

router.get('/me', verifyDriver, driverController.getProfile);
router.put('/me', verifyDriver, driverController.updateProfile);
router.delete('/me', verifyDriver, driverController.deleteAccount);

router.post('/shift/start', verifyDriver, driverController.startShift);
router.post('/shift/end', verifyDriver, driverController.endShift);
router.post('/shift/request-overtime', verifyDriver, driverController.requestOvertime);

router.get('/my-orders', verifyDriver, driverController.getMyOrders);
router.get('/orders', verifyDriver, driverController.getTodayOrders);
router.put('/orders/:orderId/status', verifyDriver, driverController.updateOrderStatus);

router.put('/location', verifyDriver, driverController.updateLocation);

router.put('/fcm-token', verifyDriver, driverController.registerFcmToken);
router.delete('/fcm-token', verifyDriver, driverController.unregisterFcmToken);

router.get('/notifications', verifyDriver, driverController.getNotifications);
router.patch('/notifications/mark-read', verifyDriver, driverController.markAllNotificationsRead);
router.patch('/notifications/:id/read', verifyDriver, driverController.markNotificationRead);

module.exports = router;
