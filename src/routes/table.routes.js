const express = require('express');
const tableController = require('../controllers/tableController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, tableController.getTables);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.createTable);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), tableController.updateTableStatus);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), tableController.deleteTable);

module.exports = router;
