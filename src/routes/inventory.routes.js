const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, inventoryController.getInventory);
router.get('/shortages', verifyToken, inventoryController.getExpectedShortages);
router.post('/synchronize', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.synchronizeInventory);
router.put('/:id/stock', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.updateStock);
router.put('/bulk-update', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.bulkUpdateStock);

module.exports = router;
