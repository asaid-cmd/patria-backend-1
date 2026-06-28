const express = require('express');
const categoryController = require('../controllers/categoryController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Menu category management (Dashboard)
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories with product counts
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of categories (direct array, no wrapper)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryItem'
 *             example:
 *               - _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: Coffee
 *                 order: 1
 *                 isActive: true
 *                 productsCount: 12
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /categories/with-counts:
 *   get:
 *     summary: Get all categories with product counts (ERB alias)
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Array of categories with productsCount
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryItem'
 */
router.get('/with-counts', categoryController.getCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new menu category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Desserts
 *               description:
 *                 type: string
 *                 example: Sweet treats and pastries
 *               icon:
 *                 type: string
 *                 example: cake
 *               order:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/CategoryDetail'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       409:
 *         description: Category name already exists
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category (name, status, order, etc.)
 *     description: |
 *       Used by the dashboard to toggle category active/inactive status
 *       and update other category fields. Send `{ "isActive": false }` to deactivate.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hot Drinks
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: Set to false to deactivate, true to activate
 *               order:
 *                 type: integer
 *                 example: 3
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/CategoryDetail'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Category not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Soft-delete a category (sets isActive to false)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Category not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.deleteCategory);

module.exports = router;
