const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, subscriptionController.getSubscriptions);
router.get('/stats', verifyToken, subscriptionController.getSubscriptionStats);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), subscriptionController.createSubscription);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), subscriptionController.updateSubscription);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), subscriptionController.cancelSubscription);

module.exports = router;
