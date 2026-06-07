const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.deleteUser);

module.exports = router;
