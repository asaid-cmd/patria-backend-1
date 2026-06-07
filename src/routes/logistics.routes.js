const express = require('express');
const logisticsController = require('../controllers/logisticsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/drivers', verifyToken, logisticsController.getDrivers);
router.post('/drivers', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.createDriver);
router.put('/drivers/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.updateDriver);
router.delete('/drivers/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.deleteDriver);

router.post('/dispatch', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), logisticsController.dispatchDriver);
router.post('/drivers/:id/complete', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), logisticsController.completeDelivery);

router.get('/zones/:zone/orders', verifyToken, logisticsController.getZoneOrders);

module.exports = router;
