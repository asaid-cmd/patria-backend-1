const express = require('express');
const kitchenController = require('../controllers/kitchenController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/orders', verifyToken, authorize(ROLES.KITCHEN, ROLES.ADMIN, ROLES.MANAGER), kitchenController.getKitchenOrders);
router.put('/orders/:id', verifyToken, authorize(ROLES.KITCHEN, ROLES.ADMIN, ROLES.MANAGER), kitchenController.updateKitchenOrderStatus);

module.exports = router;
