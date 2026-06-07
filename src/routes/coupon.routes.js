const express = require('express');
const couponController = require('../controllers/couponController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, couponController.getCoupons);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), couponController.createCoupon);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), couponController.updateCoupon);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), couponController.deleteCoupon);

module.exports = router;
