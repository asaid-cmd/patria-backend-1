const express = require('express');
const categoryController = require('../controllers/categoryController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, categoryController.getCategories);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.createCategory);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.updateCategory);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.deleteCategory);

module.exports = router;
