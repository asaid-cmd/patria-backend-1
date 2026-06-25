/**
 * Customer Mobile App Routes — all under /api/mobile/
 *
 * Auth         → /api/mobile/auth/*
 * Profile      → /api/mobile/profile/*
 * Products     → /api/mobile/products/*
 * Categories   → /api/mobile/categories
 * Cart         → /api/mobile/cart/*
 * Orders       → /api/mobile/orders/*
 * Addresses    → /api/mobile/addresses/*
 * Notifications→ /api/mobile/notifications/*
 * Offers       → /api/mobile/offers/*
 * Reviews      → /api/mobile/reviews/*
 * Zones        → /api/mobile/zones/*
 * Search       → /api/mobile/search/*
 */

const express = require('express');
const { verifyToken } = require('../middleware/auth');

const customerAuthController  = require('../controllers/customerAuthController');
const cartController           = require('../controllers/cartController');
const orderController          = require('../controllers/orderController');
const notificationController   = require('../controllers/notificationController');
const customerSearchController = require('../controllers/customerSearchController');
const zoneController           = require('../controllers/zoneController');
const offerController          = require('../controllers/offerController');
const reviewController         = require('../controllers/reviewController');
const productController        = require('../controllers/productController');
const categoryController       = require('../controllers/categoryController');

const router = express.Router();

/* ─── Middleware ─────────────────────────────────────────────────────────── */
// Customer tokens carry { id } with no role field — just verify the JWT is valid.
// Drivers carry { id, role: 'driver' } — block them from customer routes.
const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'driver') {
      return res.status(403).json({ message: 'هذا المسار مخصص لتطبيق العميل فقط' });
    }
    next();
  });
};

// Optional auth — attaches req.user if token present, never blocks the request
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  verifyToken(req, res, () => next());
};

/* ══════════════════════════════════════════════════════════════════════════
   AUTH  /api/mobile/auth/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Auth
 *   description: "Customer App: phone-based registration and login"
 */

/**
 * @swagger
 * /mobile/auth/register:
 *   post:
 *     summary: Register new customer
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password]
 *             properties:
 *               name:       { type: string, example: Ahmed Said }
 *               email:      { type: string, example: ahmed@example.com }
 *               phone:      { type: string, example: "01012345678" }
 *               password:   { type: string, example: password123 }
 *     responses:
 *       201: { description: Customer created — returns token }
 *       409: { description: Phone already registered }
 */
router.post('/auth/register', customerAuthController.register);

/**
 * @swagger
 * /mobile/auth/login:
 *   post:
 *     summary: Customer login with phone
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:    { type: string, example: "01012345678" }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200: { description: Login successful — returns token }
 *       401: { description: Invalid credentials }
 */
router.post('/auth/login', customerAuthController.login);

/**
 * @swagger
 * /mobile/auth/send-verification:
 *   post:
 *     summary: Send OTP to phone
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "01012345678" }
 *     responses:
 *       200: { description: OTP sent }
 */
router.post('/auth/send-verification', customerAuthController.sendVerification);

/**
 * @swagger
 * /mobile/auth/verify-phone:
 *   post:
 *     summary: Verify phone with OTP
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:    { type: string }
 *               code:     { type: string, example: "1234" }
 *               fcmToken: { type: string }
 *     responses:
 *       200: { description: Phone verified — returns token }
 */
router.post('/auth/verify-phone', customerAuthController.verifyPhone);

/**
 * @swagger
 * /mobile/auth/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200: { description: OTP sent if phone exists }
 */
router.post('/auth/forgot-password', customerAuthController.forgotPassword);

/**
 * @swagger
 * /mobile/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code, newPassword]
 *             properties:
 *               phone:       { type: string }
 *               code:        { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password reset }
 */
router.post('/auth/reset-password', customerAuthController.resetPassword);

/**
 * @swagger
 * /mobile/auth/oauth/login:
 *   post:
 *     summary: Google OAuth login
 *     tags: [Mobile — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       501: { description: Requires firebase-admin setup }
 */
router.post('/auth/oauth/login', customerAuthController.oauthLogin);

/**
 * @swagger
 * /mobile/auth/change-password:
 *   put:
 *     summary: Change password (authenticated)
 *     tags: [Mobile — Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.put('/auth/change-password', verifyCustomer, customerAuthController.changePassword);

/* ══════════════════════════════════════════════════════════════════════════
   PROFILE  /api/mobile/profile/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Profile
 *   description: "Customer App: profile, loyalty, favorites, addresses"
 */

/**
 * @swagger
 * /mobile/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Customer data }
 */
router.get('/profile', verifyCustomer, customerAuthController.getProfile);

/**
 * @swagger
 * /mobile/profile:
 *   put:
 *     summary: Update profile (name, email)
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 */
router.put('/profile', verifyCustomer, customerAuthController.updateProfile);

/**
 * @swagger
 * /mobile/profile/password:
 *   put:
 *     summary: Update password
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *     responses:
 *       200: { description: Password updated }
 */
router.put('/profile/password', verifyCustomer, customerAuthController.updatePassword);

/**
 * @swagger
 * /mobile/profile/loyalty:
 *   get:
 *     summary: Get loyalty points and tier
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: loyaltyPoints, tier, nextTier, pointsToNextTier }
 */
router.get('/profile/loyalty', verifyCustomer, customerAuthController.getLoyalty);

/**
 * @swagger
 * /mobile/profile/loyalty/checkout-preview:
 *   post:
 *     summary: Preview loyalty discount before checkout
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pointsToRedeem, orderTotal]
 *             properties:
 *               pointsToRedeem: { type: integer, example: 100 }
 *               orderTotal:     { type: number,  example: 250 }
 *     responses:
 *       200: { description: discount, newTotal, remainingPoints }
 */
router.post('/profile/loyalty/checkout-preview', verifyCustomer, customerAuthController.loyaltyCheckoutPreview);

/**
 * @swagger
 * /mobile/profile/favorites:
 *   get:
 *     summary: Get favorite products
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of product objects }
 */
router.get('/profile/favorites', verifyCustomer, customerAuthController.getFavorites);

/**
 * @swagger
 * /mobile/profile/favorites/{productId}:
 *   post:
 *     summary: Add product to favorites
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Added }
 */
router.post('/profile/favorites/:productId', verifyCustomer, customerAuthController.addFavorite);

/**
 * @swagger
 * /mobile/profile/favorites/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     tags: [Mobile — Profile]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Removed }
 */
router.delete('/profile/favorites/:productId', verifyCustomer, customerAuthController.removeFavorite);

/* ══════════════════════════════════════════════════════════════════════════
   ADDRESSES  /api/mobile/addresses/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Addresses
 *   description: "Customer App: saved delivery addresses"
 */

/**
 * @swagger
 * /mobile/addresses:
 *   get:
 *     summary: Get all saved addresses
 *     tags: [Mobile — Addresses]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of addresses }
 */
router.get('/addresses', verifyCustomer, customerAuthController.getAddresses);

/**
 * @swagger
 * /mobile/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Mobile — Addresses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address]
 *             properties:
 *               label:     { type: string, example: Home }
 *               address:   { type: string, example: "123 Main St, Alexandria" }
 *               lat:       { type: number }
 *               lng:       { type: number }
 *               isDefault: { type: boolean }
 *     responses:
 *       201: { description: Address added }
 */
router.post('/addresses', verifyCustomer, customerAuthController.addAddress);

/**
 * @swagger
 * /mobile/addresses/{addressId}:
 *   put:
 *     summary: Update address
 *     tags: [Mobile — Addresses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:   { type: string }
 *               address: { type: string }
 *               lat:     { type: number }
 *               lng:     { type: number }
 *     responses:
 *       200: { description: Address updated }
 */
router.put('/addresses/:addressId', verifyCustomer, customerAuthController.updateAddress);

/**
 * @swagger
 * /mobile/addresses/{addressId}:
 *   delete:
 *     summary: Delete address
 *     tags: [Mobile — Addresses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Address deleted }
 */
router.delete('/addresses/:addressId', verifyCustomer, customerAuthController.deleteAddress);

/**
 * @swagger
 * /mobile/addresses/{id}/set-default:
 *   patch:
 *     summary: Set default address
 *     tags: [Mobile — Addresses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Default address updated }
 */
router.patch('/addresses/:id/set-default', verifyCustomer, customerAuthController.setDefaultAddress);

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCTS  /api/mobile/products/*  (public)
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Products
 *   description: "Customer App: browse products (public)"
 */

/**
 * @swagger
 * /mobile/products:
 *   get:
 *     summary: Get all products (public)
 *     tags: [Mobile — Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated product list }
 */
router.get('/products', productController.getProducts);

/**
 * @swagger
 * /mobile/products/{id}:
 *   get:
 *     summary: Get single product (public)
 *     tags: [Mobile — Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product details }
 */
router.get('/products/:id', productController.getProductById);

/**
 * @swagger
 * /mobile/products/{id}/rate:
 *   post:
 *     summary: Rate a product
 *     tags: [Mobile — Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       200: { description: Rating saved }
 */
router.post('/products/:id/rate', verifyCustomer, productController.rateProduct);

/* ══════════════════════════════════════════════════════════════════════════
   CATEGORIES  /api/mobile/categories  (public)
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Categories
 *   description: "Customer App: menu categories (public)"
 */

/**
 * @swagger
 * /mobile/categories:
 *   get:
 *     summary: Get all categories (public)
 *     tags: [Mobile — Categories]
 *     responses:
 *       200: { description: Category list }
 */
router.get('/categories', categoryController.getCategories);

/* ══════════════════════════════════════════════════════════════════════════
   CART  /api/mobile/cart/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Cart
 *   description: "Customer App: shopping cart"
 */

/**
 * @swagger
 * /mobile/cart:
 *   get:
 *     summary: Get cart
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cart with items }
 */
router.get('/cart', verifyCustomer, cartController.getCart);

/**
 * @swagger
 * /mobile/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:       { type: string }
 *               quantity:        { type: integer, default: 1 }
 *               customization:   { type: object, example: { roastLevel: "Medium" } }
 *               selectedVariants: { type: array, items: { type: object } }
 *               selectedExtras:   { type: array, items: { type: object } }
 *               notes:           { type: string }
 *     responses:
 *       201: { description: Item added }
 */
router.post('/cart/add', verifyCustomer, cartController.addToCart);

/**
 * @swagger
 * /mobile/cart/to-order-items:
 *   get:
 *     summary: Convert cart to order items format
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Items ready for order placement }
 */
router.get('/cart/to-order-items', verifyCustomer, cartController.cartToOrderItems);

/**
 * @swagger
 * /mobile/cart/item/{itemId}:
 *   get:
 *     summary: Get single cart item
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cart item }
 */
router.get('/cart/item/:itemId', verifyCustomer, cartController.getCartItem);

/**
 * @swagger
 * /mobile/cart/update/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/cart/update/:itemId', verifyCustomer, cartController.updateCartItem);

/**
 * @swagger
 * /mobile/cart/remove/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Item removed }
 */
router.delete('/cart/remove/:itemId', verifyCustomer, cartController.removeCartItem);

/**
 * @swagger
 * /mobile/cart/clear:
 *   delete:
 *     summary: Clear cart
 *     tags: [Mobile — Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cart cleared }
 */
router.delete('/cart/clear', verifyCustomer, cartController.clearCart);

/* ══════════════════════════════════════════════════════════════════════════
   ORDERS  /api/mobile/orders/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Orders
 *   description: "Customer App: place, track, and review orders"
 */

/**
 * @swagger
 * /mobile/orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Mobile — Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               orderType:   { type: string, enum: [Delivery, takeaway], example: Delivery }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:  { type: string }
 *                     name:     { type: string }
 *                     quantity: { type: integer }
 *                     price:    { type: number }
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:    { type: string }
 *                   phone:   { type: string }
 *                   address: { type: string }
 *                   region:  { type: string, description: Zone ID }
 *                   location:
 *                     type: object
 *                     properties:
 *                       lat: { type: number }
 *                       lng: { type: number }
 *               summary:
 *                 type: object
 *                 properties:
 *                   subtotal:    { type: number }
 *                   deliveryFee: { type: number }
 *                   total:       { type: number }
 *               payment:
 *                 type: object
 *                 properties:
 *                   method: { type: string, enum: [Cash, Online] }
 *               notes:      { type: string }
 *               couponCode: { type: string }
 *     responses:
 *       201: { description: Order placed — appears on dashboard instantly }
 */
router.post('/orders', verifyCustomer, orderController.placeCustomerOrder);

/**
 * @swagger
 * /mobile/orders:
 *   get:
 *     summary: Get customer's order history
 *     tags: [Mobile — Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated order history }
 */
router.get('/orders', verifyCustomer, orderController.getMyOrders);
// ERB alias — must be BEFORE /:id to avoid ObjectId cast error
router.get('/orders/my-orders', verifyCustomer, orderController.getMyOrders);
router.post('/orders/reorder/:id', verifyCustomer, orderController.reorder);

router.get('/orders/:id', verifyCustomer, orderController.getOrderById);

/**
 * @swagger
 * /mobile/orders/{orderId}/tracking:
 *   get:
 *     summary: Live order tracking (status + driver location)
 *     tags: [Mobile — Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: status, deliveryStatus, driverLocation, assignedDriver info }
 */
router.get('/orders/:orderId/tracking', orderController.getOrderTracking);

/**
 * @swagger
 * /mobile/orders/{orderId}/customer-location:
 *   patch:
 *     summary: Save customer GPS location to order
 *     tags: [Mobile — Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200: { description: Location saved }
 */
router.patch('/orders/:orderId/customer-location', verifyCustomer, orderController.saveCustomerLocation);

/* ══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS  /api/mobile/notifications/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Notifications
 *   description: "Customer App: push notifications inbox"
 */

/**
 * @swagger
 * /mobile/notifications/device:
 *   post:
 *     summary: Register FCM token
 *     tags: [Mobile — Notifications]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken: { type: string }
 *               platform: { type: string, enum: [android, ios] }
 *     responses:
 *       200: { description: Token registered }
 */
router.post('/notifications/device', verifyCustomer, notificationController.registerDeviceToken);

/**
 * @swagger
 * /mobile/notifications/device:
 *   delete:
 *     summary: Unregister FCM token (logout)
 *     tags: [Mobile — Notifications]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken: { type: string }
 *     responses:
 *       200: { description: Token removed }
 */
router.delete('/notifications/device', verifyCustomer, notificationController.unregisterDeviceToken);

/**
 * @swagger
 * /mobile/notifications:
 *   get:
 *     summary: Get notifications inbox
 *     tags: [Mobile — Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated notifications }
 */
router.get('/notifications', verifyCustomer, notificationController.getCustomerNotifications);

/**
 * @swagger
 * /mobile/notifications/unread-count:
 *   get:
 *     summary: Get unread count
 *     tags: [Mobile — Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ count: 5 }" }
 */
router.get('/notifications/unread-count', verifyCustomer, notificationController.getUnreadCount);

/**
 * @swagger
 * /mobile/notifications/read-all:
 *   patch:
 *     summary: Mark all as read
 *     tags: [Mobile — Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All marked as read }
 */
router.patch('/notifications/read-all', verifyCustomer, notificationController.markAllRead);

/**
 * @swagger
 * /mobile/notifications/{id}/read:
 *   patch:
 *     summary: Mark single notification as read
 *     tags: [Mobile — Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Marked as read }
 */
router.patch('/notifications/:id/read', verifyCustomer, notificationController.markOneRead);

/* ══════════════════════════════════════════════════════════════════════════
   OFFERS & COUPONS  /api/mobile/offers/*  (public)
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Offers
 *   description: "Customer App: active promotions and coupon validation"
 */

/**
 * @swagger
 * /mobile/offers:
 *   get:
 *     summary: Get active offers (public)
 *     tags: [Mobile — Offers]
 *     responses:
 *       200: { description: Active promotional offers }
 */
router.get('/offers', offerController.getActiveOffers);

/**
 * @swagger
 * /mobile/offers/validate:
 *   post:
 *     summary: Validate coupon code
 *     tags: [Mobile — Offers]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:       { type: string, example: SAVE20 }
 *               orderTotal: { type: number, example: 300 }
 *     responses:
 *       200: { description: discount, newTotal }
 *       400: { description: Expired or limit reached }
 *       404: { description: Invalid code }
 */
router.post('/offers/validate', verifyCustomer, offerController.validateCoupon);

/* ══════════════════════════════════════════════════════════════════════════
   REVIEWS  /api/mobile/reviews/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Reviews
 *   description: "Customer App: submit and view order reviews"
 */

/**
 * @swagger
 * /mobile/reviews:
 *   post:
 *     summary: Submit order review
 *     tags: [Mobile — Reviews]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, rating]
 *             properties:
 *               orderId: { type: string }
 *               rating:  { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Review submitted }
 *       409: { description: Already reviewed }
 */
router.post('/reviews', verifyCustomer, reviewController.submitCustomerReview);

/**
 * @swagger
 * /mobile/reviews/order/{orderId}:
 *   get:
 *     summary: Get review for a specific order
 *     tags: [Mobile — Reviews]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Review object or null }
 */
router.get('/reviews/order/:orderId', verifyCustomer, reviewController.getReviewByOrder);

/* ══════════════════════════════════════════════════════════════════════════
   ZONES  /api/mobile/zones/*  (public)
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Zones
 *   description: "Customer App: delivery zones and fee lookup (public)"
 */

/**
 * @swagger
 * /mobile/zones:
 *   get:
 *     summary: Get all delivery zones
 *     tags: [Mobile — Zones]
 *     responses:
 *       200: { description: Zones with fees and estimated delivery time }
 */
router.get('/zones', zoneController.getZones);

/**
 * @swagger
 * /mobile/zones/lookup:
 *   get:
 *     summary: Find zone by GPS coordinates
 *     tags: [Mobile — Zones]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: 31.2001 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: 29.9187 }
 *     responses:
 *       200: { description: Matched zone with delivery fee }
 *       404: { description: No delivery zone for this location }
 */
router.get('/zones/lookup', optionalAuth, zoneController.lookupZone);

/* ══════════════════════════════════════════════════════════════════════════
   SEARCH  /api/mobile/search/*
══════════════════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * tags:
 *   name: Mobile — Search
 *   description: "Customer App: search history and trending"
 */

/**
 * @swagger
 * /mobile/search/log:
 *   post:
 *     summary: Log search query
 *     tags: [Mobile — Search]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string, example: "ethiopian coffee" }
 *     responses:
 *       200: { description: Logged }
 */
router.post('/search/log', verifyCustomer, customerSearchController.logSearch);

/**
 * @swagger
 * /mobile/search/last:
 *   get:
 *     summary: Get last search query
 *     tags: [Mobile — Search]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Last query string }
 */
router.get('/search/last', verifyCustomer, customerSearchController.getLastSearch);

/**
 * @swagger
 * /mobile/search/trending:
 *   get:
 *     summary: Trending searches (public)
 *     tags: [Mobile — Search]
 *     responses:
 *       200: { description: Top 10 searches in last 7 days }
 */
router.get('/search/trending', customerSearchController.getTrending);

/**
 * @swagger
 * /mobile/search/history:
 *   get:
 *     summary: Get search history
 *     tags: [Mobile — Search]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Last 20 searches }
 */
router.get('/search/history', verifyCustomer, customerSearchController.getHistory);

/**
 * @swagger
 * /mobile/search/history:
 *   delete:
 *     summary: Clear search history
 *     tags: [Mobile — Search]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: History cleared }
 */
router.delete('/search/history', verifyCustomer, customerSearchController.clearHistory);

/* ══════════════════════════════════════════════════════════════════════════
   CUSTOMER-SEARCH ALIASES  /api/mobile/customer-search/*
   Flutter uses customer-search/ prefix instead of search/
══════════════════════════════════════════════════════════════════════════ */
router.get('/customer-search/trending', customerSearchController.getTrending);
router.get('/customer-search/history',  verifyCustomer, customerSearchController.getHistory);
router.delete('/customer-search/history', verifyCustomer, customerSearchController.clearHistory);
router.post('/customer-search/log',     verifyCustomer, customerSearchController.logSearch);

/* ══════════════════════════════════════════════════════════════════════════
   ERB PATH ALIASES  /api/mobile/users/*
   Flutter app uses /users/ prefix — redirect to the same controllers
══════════════════════════════════════════════════════════════════════════ */
// Profile
router.get('/users/me',          verifyCustomer, customerAuthController.getProfile);
router.put('/users/me',          verifyCustomer, customerAuthController.updateProfile);
router.get('/users/profile',     verifyCustomer, customerAuthController.getProfile);
router.put('/users/profile',     verifyCustomer, customerAuthController.updateProfile);

// Addresses
router.get('/users/addresses',              verifyCustomer, customerAuthController.getAddresses);
router.post('/users/addresses',             verifyCustomer, customerAuthController.addAddress);
router.put('/users/addresses/:addressId',   verifyCustomer, customerAuthController.updateAddress);
router.delete('/users/addresses/:addressId',verifyCustomer, customerAuthController.deleteAddress);
router.patch('/users/addresses/:id/set-default', verifyCustomer, customerAuthController.setDefaultAddress);

// Favorites
router.get('/users/favorites',                verifyCustomer, customerAuthController.getFavorites);
router.post('/users/favorites/:productId',    verifyCustomer, customerAuthController.addFavorite);
router.delete('/users/favorites/:productId',  verifyCustomer, customerAuthController.removeFavorite);

// Loyalty
router.get('/users/loyalty',                         verifyCustomer, customerAuthController.getLoyalty);
router.post('/users/loyalty/checkout-preview',       verifyCustomer, customerAuthController.loyaltyCheckoutPreview);

module.exports = router;
