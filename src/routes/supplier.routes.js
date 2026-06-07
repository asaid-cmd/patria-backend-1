const express = require('express');
const supplierController = require('../controllers/supplierController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, supplierController.getSuppliers);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), supplierController.createSupplier);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), supplierController.updateSupplier);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), supplierController.deleteSupplier);

module.exports = router;
