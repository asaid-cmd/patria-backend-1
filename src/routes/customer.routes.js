const express = require('express');
const customerController = require('../controllers/customerController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, customerController.getCustomers);
router.get('/stats', verifyToken, customerController.getCustomerStats);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), customerController.updateCustomer);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), customerController.deleteCustomer);

module.exports = router;
