const express = require('express');
const productionController = require('../controllers/productionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Batches
router.get('/batches', verifyToken, productionController.getBatches);
router.post('/batches', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.createBatch);
router.post('/batches/:id/quality-check', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.verifyQuality);
router.patch('/batches/:id/status', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.updateBatchStatus);

// Equipment
router.get('/equipment', verifyToken, productionController.getEquipment);
router.post('/equipment', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.createEquipment);
router.put('/equipment/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.updateEquipment);
router.post('/equipment/:id/service-log', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productionController.logEquipmentService);
router.get('/equipment/:id/service-logs', verifyToken, productionController.getEquipmentServiceLogs);

module.exports = router;
