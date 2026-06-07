const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, purchaseController.getPurchaseOrders);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.createPurchaseOrder);
router.post('/:id/submit', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.submitToSupplier);
router.post('/:id/payment', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.makePayment);
router.post('/:id/receive', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.markReceived);
router.post('/:id/cancel', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.cancelPurchaseOrder);

module.exports = router;
