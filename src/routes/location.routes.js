const express = require('express');
const locationController = require('../controllers/locationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, locationController.getLocations);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.createLocation);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.updateLocation);
router.patch('/:id/toggle', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER), locationController.toggleStatus);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), locationController.deleteLocation);

module.exports = router;
