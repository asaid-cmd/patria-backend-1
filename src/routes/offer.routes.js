const express = require('express');
const offerController = require('../controllers/offerController');
const { verifyToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, offerController.getOffers);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.single('bannerImage'), offerController.createOffer);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.single('bannerImage'), offerController.updateOffer);
router.patch('/:id/toggle', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), offerController.toggleOfferStatus);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), offerController.deleteOffer);

module.exports = router;
