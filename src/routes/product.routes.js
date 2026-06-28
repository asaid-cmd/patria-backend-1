const express = require('express');
const productController = require('../controllers/productController');
const { verifyToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: |
 *     Menu product management (Dashboard + Mobile App).
 *
 *     ## Product Fields
 *
 *     | Field | Description |
 *     |-------|-------------|
 *     | `variantGroups` | Option groups like Size (Small / Medium / Large) with price adjustments |
 *     | `extras` | Optional add-ons with individual prices (e.g. Extra Shot — 5 EGP) |
 *     | `customizationOptions` | Fixed coffee options (roastLevel, grindType) — always returned by the server, never sent in requests |
 *
 *     ## Sending variantGroups & extras with form-data
 *
 *     Because this endpoint uses `multipart/form-data` for image uploads,
 *     `variantGroups` and `extras` must be sent as **JSON strings**:
 *
 *     ```
 *     variantGroups = '[{"name":"Size","required":true,"options":[{"name":"Small","priceAdjustment":0},{"name":"Large","priceAdjustment":10}]}]'
 *     extras = '[{"name":"Extra Shot","price":5},{"name":"Extra Sugar","price":0}]'
 *     ```
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (paginated)
 *     description: |
 *       Returns all active products. Supports filtering by category and search.
 *
 *       **Response format:**
 *       ```json
 *       {
 *         "products": [ { ...product objects... } ],
 *         "page": 1,
 *         "pages": 5,
 *         "total": 48
 *       }
 *       ```
 *
 *       Each product includes `variantGroups`, `extras`, and `customizationOptions`.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID (ObjectId) or category name string
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name (case-insensitive)
 *         example: "latte"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductFull'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 5
 *                 total:
 *                   type: integer
 *                   example: 48
 *             example:
 *               products:
 *                 - _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   name: "Caramel Latte"
 *                   description: "Espresso with steamed milk and caramel syrup"
 *                   price: 65
 *                   category: "Coffee"
 *                   image: "uploads/products/latte.jpg"
 *                   isActive: true
 *                   inventory: 100
 *                   rate: 4.5
 *                   reviewsCount: 12
 *                   haveCustomizationOption: true
 *                   variantGroups:
 *                     - name: "Size"
 *                       required: true
 *                       options:
 *                         - name: "Small"
 *                           priceAdjustment: 0
 *                         - name: "Medium"
 *                           priceAdjustment: 5
 *                         - name: "Large"
 *                           priceAdjustment: 10
 *                   extras:
 *                     - name: "Extra Shot"
 *                       price: 5
 *                     - name: "Extra Sugar"
 *                       price: 0
 *                   customizationOptions:
 *                     roastLevels: ["Light", "Medium", "Dark"]
 *                     grindTypes: ["Whole Bean", "Espresso", "Filter"]
 *               page: 1
 *               pages: 5
 *               total: 48
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     description: |
 *       Returns a single product object (flat response — no wrapper).
 *       Includes the full product with `variantGroups`, `extras`, and `customizationOptions`.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Product object (flat, no wrapper)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductFull'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Product not found"
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /products/{id}/rate:
 *   post:
 *     summary: Rate a product (1–5 stars)
 *     description: |
 *       Submits a star rating for a product. Updates `avgRating` and increments `ratingCount`.
 *
 *       **Response:**
 *       ```json
 *       { "avgRating": 4.5, "ratingCount": 13 }
 *       ```
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *           example:
 *             rating: 5
 *     responses:
 *       200:
 *         description: Rating saved successfully
 *         content:
 *           application/json:
 *             example:
 *               avgRating: 4.5
 *               ratingCount: 13
 *       400:
 *         description: Invalid rating value (must be between 1 and 5)
 */
router.post('/:id/rate', verifyToken, productController.rateProduct);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: |
 *       Creates a new menu product. Supports image upload via `multipart/form-data`.
 *
 *       **Roles required:** ADMIN or MANAGER
 *
 *       ---
 *
 *       ## variantGroups — Option Groups
 *
 *       Use variant groups to define size or type options that affect the price.
 *       Each group has a `name`, a `required` flag, and a list of `options`.
 *       Each option has a `name` and a `priceAdjustment` (added to the base price).
 *
 *       **Example — Size:**
 *       ```json
 *       [
 *         {
 *           "name": "Size",
 *           "required": true,
 *           "options": [
 *             { "name": "Small",  "priceAdjustment": 0  },
 *             { "name": "Medium", "priceAdjustment": 5  },
 *             { "name": "Large",  "priceAdjustment": 10 }
 *           ]
 *         }
 *       ]
 *       ```
 *
 *       **Example — Milk Type:**
 *       ```json
 *       [
 *         {
 *           "name": "Milk Type",
 *           "required": false,
 *           "options": [
 *             { "name": "Regular",  "priceAdjustment": 0 },
 *             { "name": "Oat Milk", "priceAdjustment": 8 },
 *             { "name": "Soy Milk", "priceAdjustment": 8 }
 *           ]
 *         }
 *       ]
 *       ```
 *
 *       ---
 *
 *       ## extras — Optional Add-ons
 *
 *       Optional items the customer can add to their order. Each extra has a name and a fixed price.
 *
 *       **Example:**
 *       ```json
 *       [
 *         { "name": "Extra Shot",    "price": 5 },
 *         { "name": "Extra Sugar",   "price": 0 },
 *         { "name": "Whipped Cream", "price": 8 }
 *       ]
 *       ```
 *
 *       ---
 *
 *       ## customizationOptions — Fixed Coffee Options
 *
 *       These are **not sent** in the request. The server always returns them automatically:
 *       ```json
 *       {
 *         "roastLevels": ["Light", "Medium", "Dark"],
 *         "grindTypes":  ["Whole Bean", "Espresso", "Filter"]
 *       }
 *       ```
 *       The customer selects their preferred `roastLevel` and `grindType` when placing an order.
 *
 *       ---
 *
 *       ## Important — form-data + JSON fields
 *
 *       Because this endpoint uses `multipart/form-data` for image uploads,
 *       `variantGroups` and `extras` must be sent as **JSON strings** (not objects):
 *
 *       ```
 *       // Correct — JSON string
 *       variantGroups = '[{"name":"Size","required":true,"options":[...]}]'
 *
 *       // Wrong — object does not work with form-data
 *       variantGroups = [{ name: "Size", ... }]
 *       ```
 *
 *       **Response:**
 *       ```json
 *       { "statusCode": 201, "success": true, "message": "Product created", "data": { "product": {...} } }
 *       ```
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name (required)
 *                 example: "Caramel Latte"
 *               description:
 *                 type: string
 *                 description: Product description (optional)
 *                 example: "Espresso with steamed milk and caramel syrup"
 *               price:
 *                 type: number
 *                 description: Selling price in EGP (required)
 *                 example: 65
 *               categoryId:
 *                 type: string
 *                 description: |
 *                   Category MongoDB ObjectId (required).
 *                   Use `GET /categories` to get available IDs.
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               cost:
 *                 type: number
 *                 description: Cost price in EGP — for internal reports (optional)
 *                 example: 25
 *               sku:
 *                 type: string
 *                 description: Internal product code (optional)
 *                 example: "LAT-CAR-001"
 *               stockQty:
 *                 type: integer
 *                 description: Available stock quantity (default 0)
 *                 example: 100
 *               lowStockThreshold:
 *                 type: integer
 *                 description: Low stock alert threshold (default 5)
 *                 example: 10
 *               isActive:
 *                 type: boolean
 *                 description: Whether this product is visible in the menu (default true)
 *                 example: true
 *               roastLevel:
 *                 type: string
 *                 enum: [Light, Medium, Dark]
 *                 description: Roast level — for coffee products only (optional)
 *                 example: "Medium"
 *               grindType:
 *                 type: string
 *                 enum: [Whole Bean, Espresso, Filter]
 *                 description: Grind type — for coffee products only (optional)
 *                 example: "Espresso"
 *               variantGroups:
 *                 type: string
 *                 description: |
 *                   **JSON string** — option groups (size, milk type, etc.).
 *                   Must be sent as a JSON string when using form-data.
 *
 *                   **Format:**
 *                   ```json
 *                   [{"name":"Size","required":true,"options":[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":5},{"name":"Large","priceAdjustment":10}]}]
 *                   ```
 *                 example: '[{"name":"Size","required":true,"options":[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":5},{"name":"Large","priceAdjustment":10}]}]'
 *               extras:
 *                 type: string
 *                 description: |
 *                   **JSON string** — optional add-ons with individual prices.
 *                   Must be sent as a JSON string when using form-data.
 *
 *                   **Format:**
 *                   ```json
 *                   [{"name":"Extra Shot","price":5},{"name":"Whipped Cream","price":8}]
 *                   ```
 *                 example: '[{"name":"Extra Shot","price":5},{"name":"Extra Sugar","price":0}]'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (optional — max 5 files)
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product created"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/ProductStored'
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: "Product created"
 *               data:
 *                 product:
 *                   _id: "64f1a2b3c4d5e6f7a8b9c0d5"
 *                   name: "Caramel Latte"
 *                   description: "Espresso with steamed milk and caramel syrup"
 *                   price: 65
 *                   cost: 25
 *                   categoryId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   isActive: true
 *                   stockQty: 100
 *                   lowStockThreshold: 10
 *                   images: ["uploads/products/latte.jpg"]
 *                   variantGroups:
 *                     - _id: "64f1a2b3c4d5e6f7a8b9c0d6"
 *                       name: "Size"
 *                       required: true
 *                       options:
 *                         - _id: "64f1a2b3c4d5e6f7a8b9c0d7"
 *                           name: "Small"
 *                           priceAdjustment: 0
 *                         - _id: "64f1a2b3c4d5e6f7a8b9c0d8"
 *                           name: "Medium"
 *                           priceAdjustment: 5
 *                         - _id: "64f1a2b3c4d5e6f7a8b9c0d9"
 *                           name: "Large"
 *                           priceAdjustment: 10
 *                   extras:
 *                     - _id: "64f1a2b3c4d5e6f7a8b9c0da"
 *                       name: "Extra Shot"
 *                       price: 5
 *                   createdAt: "2026-06-28T10:00:00.000Z"
 *                   updatedAt: "2026-06-28T10:00:00.000Z"
 *                   __v: 0
 *       400:
 *         description: Validation error — missing required fields or invalid format
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 400
 *               success: false
 *               message: "\"price\" is required"
 *               data: null
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.array('images', 5), productController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     description: |
 *       Updates all fields of a product. Same rules as POST — send `variantGroups` and `extras` as **JSON strings**.
 *
 *       If `images` are included, they **replace** the existing images.
 *       If no `images` field is sent, existing images are kept unchanged.
 *
 *       **Roles required:** ADMIN or MANAGER
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d5"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Caramel Latte Updated"
 *               description:
 *                 type: string
 *                 example: "Rich espresso with caramel and oat milk"
 *               price:
 *                 type: number
 *                 example: 70
 *               categoryId:
 *                 type: string
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               cost:
 *                 type: number
 *                 example: 28
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               stockQty:
 *                 type: integer
 *                 example: 80
 *               lowStockThreshold:
 *                 type: integer
 *                 example: 10
 *               roastLevel:
 *                 type: string
 *                 enum: [Light, Medium, Dark]
 *                 example: "Medium"
 *               grindType:
 *                 type: string
 *                 enum: [Whole Bean, Espresso, Filter]
 *                 example: "Espresso"
 *               variantGroups:
 *                 type: string
 *                 description: JSON string — replaces all existing variant groups
 *                 example: '[{"name":"Size","required":true,"options":[{"name":"Small","priceAdjustment":0},{"name":"Large","priceAdjustment":15}]}]'
 *               extras:
 *                 type: string
 *                 description: JSON string — replaces all existing extras
 *                 example: '[{"name":"Extra Shot","price":5},{"name":"Whipped Cream","price":8}]'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New images — replaces existing images if provided (max 5 files)
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: "Success"
 *               data:
 *                 product:
 *                   _id: "64f1a2b3c4d5e6f7a8b9c0d5"
 *                   name: "Caramel Latte Updated"
 *                   price: 70
 *                   isActive: true
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Product not found
 */
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), upload.array('images', 5), productController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Soft-delete a product (sets isActive = false)
 *     description: |
 *       Does **not** physically remove the product from the database.
 *       Sets `isActive = false` so it no longer appears in product listings.
 *
 *       **Response:**
 *       ```json
 *       { "statusCode": 200, "success": true, "message": "Product deleted", "data": null }
 *       ```
 *
 *       **Roles required:** ADMIN or MANAGER
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product MongoDB ObjectId
 *         example: "64f1a2b3c4d5e6f7a8b9c0d5"
 *     responses:
 *       200:
 *         description: Product soft-deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: "Product deleted"
 *               data: null
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or MANAGER role
 *       404:
 *         description: Product not found
 */
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), productController.deleteProduct);

module.exports = router;
