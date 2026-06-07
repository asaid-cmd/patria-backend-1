const express = require('express');
const reportController = require('../controllers/reportController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/overview', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getOverviewReport);
router.get('/employees', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getEmployeeReport);
router.get('/branches', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getBranchReport);
router.get('/analytics', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getAnalytics);
router.get('/export', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.exportData);

module.exports = router;
