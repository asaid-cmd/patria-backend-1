const express = require('express');
const zoneController = require('../controllers/zoneController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', zoneController.getZones);
router.get('/lookup', zoneController.lookupZone);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), zoneController.createZone);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), zoneController.updateZone);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), zoneController.deleteZone);

module.exports = router;
