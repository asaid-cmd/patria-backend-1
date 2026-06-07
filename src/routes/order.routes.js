const express = require('express');
const orderController = require('../controllers/orderController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, orderController.getOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.post('/', verifyToken, authorize(ROLES.CASHIER, ROLES.STAFF, ROLES.ADMIN, ROLES.MANAGER), orderController.createOrder);
router.put('/:id', verifyToken, orderController.updateOrderStatus);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), orderController.deleteOrder);

module.exports = router;
