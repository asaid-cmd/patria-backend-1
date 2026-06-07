const express = require('express');
const shiftController = require('../controllers/shiftController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.post('/shifts/open', verifyToken, authorize(ROLES.CASHIER, ROLES.ADMIN, ROLES.MANAGER), shiftController.openShift);
router.put('/shifts/close', verifyToken, authorize(ROLES.CASHIER, ROLES.ADMIN, ROLES.MANAGER), shiftController.closeShift);
router.get('/shifts/current', verifyToken, shiftController.getCurrentShift);
router.get('/shifts/:shiftId', verifyToken, shiftController.getShiftSummary);

module.exports = router;
