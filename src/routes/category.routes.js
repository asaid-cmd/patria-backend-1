const express = require('express');
const categoryController = require('../controllers/categoryController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: |
 *     Menu category management (Dashboard).
 *
 *     **⚠️ Response format for GET /categories is a direct array (no wrapper object).**
 *     All other endpoints return `{ category: {...} }` or `{ message: "..." }`.
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories with product counts
 *     description: |
 *       Returns a **direct array** of active categories sorted by `order`.
 *       Each item includes `productsCount` (number of active products in that category).
 *
 *       > ⚠️ This endpoint does NOT require authentication and returns the array directly — no wrapper object.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of active categories (direct array, no wrapper)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryItem'
 *             example:
 *               - _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Coffee"
 *                 order: 1
 *                 isActive: true
 *                 productsCount: 12
 *               - _id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 name: "Cold Drinks"
 *                 order: 2
 *                 isActive: true
 *                 productsCount: 8
 *               - _id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Pastries"
 *                 order: 3
 *                 isActive: true
 *                 productsCount: 5
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /categories/with-counts:
 *   get:
 *     summary: Get all categories with product counts (alias)
 *     description: Same as `GET /categories` — provided for mobile app compatibility.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Array of active categories with productsCount
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
 *     description: |
 *       Creates a new category. Category name must be unique.
 *
 *       **Response:** `{ category: {...} }` with the created category object and a `message`.
 *
 *       **Roles required:** ADMIN or MANAGER
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category display name (must be unique)
 *                 example: Desserts
 *               description:
 *                 type: string
 *                 description: Optional short description
 *                 example: Sweet treats and pastries
 *               icon:
 *                 type: string
 *                 description: Icon identifier or URL
 *                 example: cake
 *               order:
 *                 type: integer
 *                 description: Display order (lower = first). Defaults to 0.
 *                 example: 5
 *           example:
 *             name: "Desserts"
 *             description: "Sweet treats and pastries"
 *             icon: "cake"
 *             order: 5
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
 *                 message:
 *                   type: string
 *             example:
 *               category:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Desserts"
 *                 description: "Sweet treats and pastries"
 *                 icon: "cake"
 *                 order: 5
 *                 isActive: true
 *                 isIngredient: false
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T10:00:00.000Z"
 *                 __v: 0
 *               message: "Category created"
 *       400:
 *         description: Validation error — missing required fields
 *         content:
 *           application/json:
 *             example:
 *               message: "\"name\" is required"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             example:
 *               message: "Category name already exists"
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category (name, status, order, icon, etc.)
 *     description: |
 *       Updates one or more fields of an existing category.
 *
 *       **Dashboard uses this to toggle active/inactive:**
 *       Send `{ "isActive": false }` to deactivate, `{ "isActive": true }` to activate.
 *
 *       **Response:** `{ category: {...} }` with the updated category.
 *
 *       **Roles required:** ADMIN or MANAGER
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
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hot Beverages
 *               isActive:
 *                 type: boolean
 *                 description: Set to false to deactivate, true to activate
 *                 example: false
 *               order:
 *                 type: integer
 *                 example: 3
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *           examples:
 *             toggle_inactive:
 *               summary: Deactivate a category
 *               value:
 *                 isActive: false
 *             toggle_active:
 *               summary: Reactivate a category
 *               value:
 *                 isActive: true
 *             rename:
 *               summary: Rename a category
 *               value:
 *                 name: "Hot Beverages"
 *                 order: 2
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
 *             example:
 *               category:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Hot Beverages"
 *                 order: 2
 *                 isActive: false
 *                 isIngredient: false
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T11:00:00.000Z"
 *                 __v: 0
 *       400:
 *         description: Validation error or empty body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Category not found"
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Soft-delete a category (sets isActive = false)
 *     description: |
 *       Does **not** physically remove the category from the database.
 *       Sets `isActive = false` so it no longer appears in category listings.
 *
 *       **Response:** `{ message: "Category deleted" }`
 *
 *       **Roles required:** ADMIN or MANAGER
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
 *         description: Category soft-deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Category deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Category not found"
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), categoryController.deleteCategory);

module.exports = router;
