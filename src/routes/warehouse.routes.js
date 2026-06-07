const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, warehouseController.getWarehouses);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), warehouseController.createWarehouse);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), warehouseController.updateWarehouse);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), warehouseController.deleteWarehouse);

router.get('/transfers', verifyToken, warehouseController.getTransfers);
router.post('/transfers', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), warehouseController.createTransfer);
router.patch('/transfers/:id/status', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), warehouseController.updateTransferStatus);

module.exports = router;
