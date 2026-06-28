const express = require('express');
const authController = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const verifyCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'customer') {
      const { sendError } = require('../utils/apiResponse');
      return sendError(res, 'Customer access required', 403);
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Auth — Dashboard
 *   description: |
 *     Staff/Admin authentication for the management dashboard.
 *
 *     **Login Flow:**
 *     1. `POST /auth/admin/login` → receive `accessToken` (15 min) + `refreshToken` (7 days)
 *     2. Add `Authorization: Bearer <accessToken>` header to every request
 *     3. When `accessToken` expires (401 response), call `POST /auth/refresh`
 *     4. The dashboard axios interceptor handles this automatically
 *
 *     **⚠️ Important:** `POST /auth/refresh` returns a **wrapped** response format (required by axios interceptor):
 *     `{ statusCode, success, message, data: { accessToken, refreshToken } }`
 *     All other auth endpoints return flat JSON.
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Customer mobile app — phone-based authentication
 */

// ─── Dashboard (Admin/Staff) Auth ────────────────────────────────────────────

/**
 * @swagger
 * /auth/admin/register:
 *   post:
 *     summary: Register the first admin/staff account
 *     description: |
 *       Creates a new staff user with `superadmin` role. Use this to create the first admin account.
 *
 *       **Response format (flat):**
 *       ```json
 *       {
 *         "user": { "_id": "...", "name": "...", "email": "...", "role": "superadmin", ... },
 *         "accessToken": "eyJ...",
 *         "refreshToken": "eyJ...",
 *         "message": "Registered successfully"
 *       }
 *       ```
 *
 *       > ⚠️ No authentication required for this endpoint.
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ahmed Admin"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@patria.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *           example:
 *             name: "Ahmed Admin"
 *             email: "admin@patria.com"
 *             password: "password123"
 *     responses:
 *       201:
 *         description: Admin registered — returns tokens + user object
 *         content:
 *           application/json:
 *             example:
 *               user:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Ahmed Admin"
 *                 email: "admin@patria.com"
 *                 role: "superadmin"
 *                 isActive: true
 *                 createdAt: "2026-06-28T10:00:00.000Z"
 *                 updatedAt: "2026-06-28T10:00:00.000Z"
 *                 __v: 0
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "Registered successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "\"email\" must be a valid email"
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             example:
 *               message: "Email already registered"
 */
router.post('/admin/register', authController.register);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Login with email + password (Dashboard)
 *     description: |
 *       Authenticates a staff user and returns an access token + refresh token.
 *
 *       **Response format (flat):**
 *       ```json
 *       {
 *         "user": { "_id": "...", "name": "...", "email": "...", "role": "admin", "isActive": true, "lastLogin": "...", ... },
 *         "accessToken": "eyJ...",
 *         "refreshToken": "eyJ...",
 *         "message": "Login successful"
 *       }
 *       ```
 *
 *       **Store tokens and use:**
 *       - `accessToken` → `Authorization: Bearer <accessToken>` header
 *       - `refreshToken` → call `POST /auth/refresh` when access token expires
 *
 *       > ⚠️ No authentication required for this endpoint.
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@patria.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *           example:
 *             email: "admin@patria.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken + refreshToken + user
 *         content:
 *           application/json:
 *             example:
 *               user:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Ahmed Admin"
 *                 email: "admin@patria.com"
 *                 role: "admin"
 *                 isActive: true
 *                 lastLogin: "2026-06-28T10:00:00.000Z"
 *                 createdAt: "2026-01-01T00:00:00.000Z"
 *                 updatedAt: "2026-06-28T10:00:00.000Z"
 *                 __v: 0
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "Login successful"
 *       400:
 *         description: Validation error — missing fields
 *         content:
 *           application/json:
 *             example:
 *               message: "\"email\" must be a valid email"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid credentials"
 */
router.post('/admin/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using the refresh token
 *     description: |
 *       Exchanges a valid `refreshToken` for a new `accessToken` and `refreshToken`.
 *
 *       **⚠️ Special wrapped response format** (required by the dashboard axios interceptor):
 *       ```json
 *       {
 *         "statusCode": 200,
 *         "success": true,
 *         "message": "Token refreshed successfully",
 *         "data": {
 *           "accessToken": "eyJ...",
 *           "refreshToken": "eyJ..."
 *         }
 *       }
 *       ```
 *
 *       > This is the **only** endpoint that returns a wrapped response format.
 *       > All other endpoints return flat JSON.
 *
 *       > ⚠️ No authentication required for this endpoint.
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received from login
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: New tokens issued successfully (wrapped format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: "Token refreshed successfully"
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Refresh token missing
 *         content:
 *           application/json:
 *             example:
 *               message: "Refresh token required"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid refresh token"
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate the current session
 *     description: |
 *       Invalidates the current refresh token. The client should also clear stored tokens.
 *
 *       **Response format:**
 *       ```json
 *       { "message": "Logged out successfully" }
 *       ```
 *
 *       **Requires:** `Authorization: Bearer <accessToken>`
 *     tags: [Auth — Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Logged out successfully"
 *       401:
 *         description: Unauthorized — missing or invalid token
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated staff user profile
 *     description: |
 *       Returns the full profile of the currently logged-in staff user.
 *
 *       **Response format (flat — returns user object directly):**
 *       ```json
 *       {
 *         "_id": "...",
 *         "name": "Ahmed Admin",
 *         "email": "admin@patria.com",
 *         "role": "admin",
 *         "isActive": true,
 *         "lastLogin": "2026-06-28T10:00:00.000Z",
 *         "createdAt": "...",
 *         "updatedAt": "...",
 *         "__v": 0
 *       }
 *       ```
 *
 *       **Requires:** `Authorization: Bearer <accessToken>`
 *     tags: [Auth — Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile (flat user object)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffUser'
 *             example:
 *               _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               name: "Ahmed Admin"
 *               email: "admin@patria.com"
 *               role: "admin"
 *               isActive: true
 *               lastLogin: "2026-06-28T10:00:00.000Z"
 *               createdAt: "2026-01-01T00:00:00.000Z"
 *               updatedAt: "2026-06-28T10:00:00.000Z"
 *               __v: 0
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized"
 *       404:
 *         description: User not found
 */
router.get('/me', verifyToken, authController.me);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     description: |
 *       **For Dashboard (Admin):** Send `{ "email": "admin@patria.com" }`
 *       → Backend sends a password reset email (or returns a success message regardless).
 *
 *       **For Mobile App (Customer):** Send `{ "phone": "01012345678" }`
 *       → Backend sends an OTP SMS.
 *
 *       **Response format:**
 *       ```json
 *       { "message": "If email exists, password reset link sent" }
 *       ```
 *
 *       > ⚠️ Always returns 200 even if the email/phone does not exist (security measure).
 *     tags: [Auth — Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - title: Admin (email-based)
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "admin@patria.com"
 *               - title: Customer (phone-based)
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "01012345678"
 *           examples:
 *             admin_email:
 *               summary: Dashboard admin reset
 *               value:
 *                 email: "admin@patria.com"
 *             customer_phone:
 *               summary: Mobile customer reset
 *               value:
 *                 phone: "01012345678"
 *     responses:
 *       200:
 *         description: Reset request accepted (always 200 for security)
 *         content:
 *           application/json:
 *             example:
 *               message: "If email exists, password reset link sent"
 */
router.post('/forgot-password', (req, res, next) => {
  if (req.body.email && !req.body.phone) {
    return authController.forgotPassword(req, res, next);
  }
  return customerAuthController.forgotPassword(req, res, next);
});

// ─── Customer Mobile Auth ────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new customer account (mobile app)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed Said
 *               email:
 *                 type: string
 *                 example: ahmed@example.com
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Customer registered — returns token
 *       409:
 *         description: Phone already registered
 */
router.post('/register', customerAuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login — customer (phone) or staff (email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - title: Customer Login (phone)
 *                 type: object
 *                 required: [phone, password]
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "01012345678"
 *                   password:
 *                     type: string
 *               - title: Staff Login (email)
 *                 type: object
 *                 required: [email, password]
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: admin@patria.com
 *                   password:
 *                     type: string
 *     responses:
 *       200:
 *         description: Login successful — returns token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res, next) => {
  if (req.body.phone && !req.body.email) {
    return customerAuthController.login(req, res, next);
  }
  return authController.login(req, res, next);
});

/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: Send OTP to customer phone
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *     responses:
 *       200:
 *         description: OTP sent (returned in response for testing)
 */
router.post('/send-verification', customerAuthController.sendVerification);

/**
 * @swagger
 * /auth/verify-phone:
 *   post:
 *     summary: Verify customer phone with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "1234"
 *               fcmToken:
 *                 type: string
 *                 description: Optional FCM token to register on verify
 *     responses:
 *       200:
 *         description: Phone verified — returns token
 */
router.post('/verify-phone', customerAuthController.verifyPhone);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code, newPassword]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', customerAuthController.resetPassword);

/**
 * @swagger
 * /auth/oauth/login:
 *   post:
 *     summary: Google OAuth login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from Firebase Auth
 *     responses:
 *       501:
 *         description: Requires firebase-admin configuration
 */
router.post('/oauth/login', customerAuthController.oauthLogin);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change customer password (authenticated)
 *     tags: [Auth]
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
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/change-password', verifyCustomer, customerAuthController.changePassword);

module.exports = router;
