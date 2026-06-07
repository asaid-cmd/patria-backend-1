const express = require('express');
const financialController = require('../controllers/financialController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/overview', verifyToken, financialController.getFinancialOverview);
router.get('/transactions', verifyToken, financialController.getTransactions);
router.post('/transactions', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), financialController.createTransaction);

module.exports = router;
