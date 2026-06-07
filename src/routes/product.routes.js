const express = require('express');
const productController = require('../controllers/productController');
const { verifyToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, productController.getProducts);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.array('images', 5), productController.createProduct);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.array('images', 5), productController.updateProduct);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productController.deleteProduct);

module.exports = router;
