const express = require('express');
const reviewController = require('../controllers/reviewController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, reviewController.getReviews);
router.post('/', reviewController.createReview);
router.patch('/:id/visibility', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reviewController.toggleVisibility);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reviewController.deleteReview);

module.exports = router;
