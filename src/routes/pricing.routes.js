const express = require('express');
const pricingController = require('../controllers/pricingController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, pricingController.getPricingRules);
router.post('/rules', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.createPricingRule);
router.put('/rules/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.updatePricingRule);
router.delete('/rules/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.deletePricingRule);

router.get('/pricelists', verifyToken, pricingController.getPriceLists);
router.post('/pricelists', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.createPriceList);
router.put('/pricelists/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.updatePriceList);
router.delete('/pricelists/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), pricingController.deletePriceList);

module.exports = router;
