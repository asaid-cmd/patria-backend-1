const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Patria Coffee & Beans — Full API',
      version: '2.0.0',
      description: `
# Patria Coffee & Beans — API Documentation

> **Base URL (Dashboard):** \`https://api.patriacoffeebeans.com/api\`
> **Base URL (Mobile App):** \`https://api.patriacoffeebeans.com/api/mobile\`
> **Base URL (Driver App):** \`https://api.patriacoffeebeans.com/api/driver\`

---

## 🔐 Authentication

All protected dashboard endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Token Flow:**
1. Call \`POST /auth/admin/login\` → receive \`accessToken\` (15 min) + \`refreshToken\` (7 days)
2. Attach \`accessToken\` to every request header
3. When you get a 401, call \`POST /auth/refresh\` with the \`refreshToken\` to get a new \`accessToken\`
4. The dashboard axios interceptor handles token refresh automatically

---

## 📦 Response Format — Dashboard

### Standard Success (create / update / list)
Responses return the data **directly** (flat JSON):
\`\`\`json
{ "location": { "_id": "...", "name": "Maadi", "deliveryFee": 20, ... } }
\`\`\`

### Delete Success
When there is no data to return:
\`\`\`json
{ "message": "Delivery zone deleted" }
\`\`\`

### Refresh Token — Special Format ⚠️
The \`POST /auth/refresh\` endpoint returns a **wrapped** response (required by the axios interceptor):
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
\`\`\`

### Error Response
\`\`\`json
{ "message": "Invalid credentials" }
\`\`\`

---

## 👤 Staff Roles

| Role | Value | Access |
|------|-------|--------|
| Super Admin | \`superadmin\` | Full access |
| Admin | \`admin\` | User & content management |
| Manager | \`manager\` | Staff & reports |
| Cashier | \`cashier\` | Orders & shifts |
| Kitchen | \`kitchen\` | Order preparation |
| Staff | \`staff\` | Limited access |

---

## 📋 Dashboard Endpoints Summary

### Auth (Dashboard)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/admin/register | ❌ | Create first admin account |
| POST | /auth/admin/login | ❌ | Login with email + password |
| POST | /auth/refresh | ❌ | Get new access token |
| POST | /auth/logout | ✅ | Invalidate session |
| GET | /auth/me | ✅ | Get current user profile |
| POST | /auth/forgot-password | ❌ | Send reset email (send \`{ email }\`) |

### Categories
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /categories | ✅ | All | Returns array of active categories with product counts |
| POST | /categories | ✅ | ADMIN, MANAGER | Create new category |
| PUT | /categories/:id | ✅ | ADMIN, MANAGER | Update or toggle category (send \`{ isActive: false }\`) |
| DELETE | /categories/:id | ✅ | ADMIN, MANAGER | Soft delete (sets isActive = false) |

### Locations (Delivery Zones)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /locations | ✅ | All | Get all zones + stats |
| POST | /locations | ✅ | ADMIN, SUPER_ADMIN, MANAGER | Create zone |
| PUT | /locations/:id | ✅ | ADMIN, SUPER_ADMIN, MANAGER | Update zone |
| PATCH | /locations/:id/toggle | ✅ | ADMIN, SUPER_ADMIN, MANAGER | Toggle active status |
| DELETE | /locations/:id | ✅ | ADMIN, SUPER_ADMIN | Delete zone |

### Tables
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /tables | ✅ | All | Paginated list of tables |
| POST | /tables | ✅ | ADMIN, MANAGER | Create table |
| PUT | /tables/:id | ✅ | ADMIN, MANAGER, CASHIER | Update table status |
| DELETE | /tables/:id | ✅ | ADMIN, MANAGER | Delete table |

### Reservations
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /reservations | ✅ | All | Paginated list, filter by \`?date=YYYY-MM-DD\` |
| POST | /reservations | ✅ | All | Create reservation |
| PUT | /reservations/:id | ✅ | ADMIN, MANAGER | Update reservation status |
| DELETE | /reservations/:id | ✅ | ADMIN, MANAGER | Delete reservation |

---

## 📱 Customer Mobile App (/api/mobile/*)

Login with **phone + password** → returns \`{ _id, name, phone, role, token, loyaltyPoints, tier }\`

Key paths: \`/mobile/auth/login\`, \`/mobile/cart\`, \`/mobile/orders\`, \`/mobile/offers\`, \`/mobile/zones\`

---

## 🚗 Driver Mobile App (/api/driver/*)

Login with **phone + password** → returns \`{ _id, name, phone, vehicleType, status, token }\`

Key paths: \`/driver/login\`, \`/driver/shift/start\`, \`/driver/orders\`, \`/driver/location\`
      `,
    },
    servers: [
      {
        url: 'https://api.patriacoffeebeans.com/api',
        description: 'Production — Dashboard',
      },
      {
        url: 'https://api.patriacoffeebeans.com/api/mobile',
        description: 'Production — Customer Mobile App',
      },
      {
        url: 'https://api.patriacoffeebeans.com/api/driver',
        description: 'Production — Driver Mobile App',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`,
        description: 'Development — Dashboard',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/mobile`,
        description: 'Development — Customer Mobile App',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/driver`,
        description: 'Development — Driver Mobile App',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from login (staff or customer or driver)',
        },
      },
      schemas: {
        // ─── Generic ──────────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Invalid credentials' },
          },
        },
        OkResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total:       { type: 'integer', example: 50 },
            page:        { type: 'integer', example: 1 },
            limit:       { type: 'integer', example: 20 },
            totalPages:  { type: 'integer', example: 3 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },

        // ─── Dashboard — Auth ─────────────────────────────────────────────────
        StaffUser: {
          type: 'object',
          description: 'Staff/Admin user object returned from login and /auth/me',
          properties: {
            _id:       { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name:      { type: 'string', example: 'Ahmed Admin' },
            email:     { type: 'string', example: 'admin@patria.com' },
            role: {
              type: 'string',
              enum: ['superadmin', 'admin', 'manager', 'cashier', 'kitchen', 'staff'],
              example: 'admin',
            },
            isActive:  { type: 'boolean', example: true },
            lastLogin: { type: 'string', format: 'date-time', example: '2026-06-28T12:00:00.000Z' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            __v:       { type: 'integer', example: 0 },
          },
        },
        RefreshTokenResponse: {
          type: 'object',
          description: 'Wrapped response returned by POST /auth/refresh',
          properties: {
            statusCode: { type: 'integer', example: 200 },
            success:    { type: 'boolean', example: true },
            message:    { type: 'string', example: 'Token refreshed successfully' },
            data: {
              type: 'object',
              properties: {
                accessToken:  { type: 'string', description: 'New JWT access token (15 min)' },
                refreshToken: { type: 'string', description: 'New JWT refresh token (7 days)' },
              },
            },
          },
        },

        // ─── Dashboard — Categories ───────────────────────────────────────────
        CategoryItem: {
          type: 'object',
          description: 'Category item as returned by GET /categories (ERB format — direct array)',
          properties: {
            _id:           { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name:          { type: 'string', example: 'Coffee' },
            order:         { type: 'integer', example: 1 },
            isActive:      { type: 'boolean', example: true },
            productsCount: { type: 'integer', example: 12 },
          },
        },
        CategoryDetail: {
          type: 'object',
          description: 'Category object returned on create/update',
          properties: {
            _id:         { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name:        { type: 'string', example: 'Desserts' },
            description: { type: 'string', example: 'Sweet treats' },
            icon:        { type: 'string', example: 'cake' },
            order:       { type: 'integer', example: 5 },
            isActive:    { type: 'boolean', example: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
            __v:         { type: 'integer', example: 0 },
          },
        },

        // ─── Dashboard — Locations (Delivery Zones) ───────────────────────────
        DeliveryZone: {
          type: 'object',
          description: 'Delivery zone object. status field is computed from isActive.',
          properties: {
            _id:            { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            id:             { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'Alias for _id (Mongoose virtual)' },
            name:           { type: 'string', example: 'Maadi' },
            deliveryFee:    { type: 'number', example: 20, description: 'Delivery fee in EGP' },
            minOrderAmount: { type: 'number', example: 100, description: 'Minimum order amount in EGP' },
            isActive:       { type: 'boolean', example: true },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
              example: 'Active',
              description: 'Computed from isActive: true → Active, false → Inactive',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            __v:       { type: 'integer', example: 0 },
          },
        },
        LocationStats: {
          type: 'object',
          properties: {
            total:    { type: 'integer', example: 5 },
            active:   { type: 'integer', example: 4 },
            inactive: { type: 'integer', example: 1 },
          },
        },

        // ─── Dashboard — Tables ───────────────────────────────────────────────
        Table: {
          type: 'object',
          properties: {
            _id:      { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            number:   { type: 'integer', example: 5 },
            capacity: { type: 'integer', example: 4 },
            section: {
              type: 'string',
              enum: ['main_hall', 'terrace', 'vip', 'counter'],
              example: 'main_hall',
            },
            status: {
              type: 'string',
              enum: ['available', 'occupied'],
              example: 'available',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            __v:       { type: 'integer', example: 0 },
          },
        },

        // ─── Dashboard — Reservations ─────────────────────────────────────────
        Reservation: {
          type: 'object',
          properties: {
            _id:           { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            customerName:  { type: 'string', example: 'Ahmed Said' },
            phone:         { type: 'string', example: '01012345678' },
            customerEmail: { type: 'string', example: 'ahmed@example.com' },
            numberOfPeople: { type: 'integer', example: 4 },
            date:          { type: 'string', format: 'date-time', example: '2026-06-28T00:00:00.000Z' },
            time:          { type: 'string', example: '19:00' },
            tableId:       { $ref: '#/components/schemas/Table', description: 'Populated table object' },
            status: {
              type: 'string',
              enum: ['on_hold', 'confirmed', 'sitting', 'ended', 'cancelled'],
              example: 'on_hold',
              description: 'Status flow: on_hold → confirmed → sitting → ended. Any → cancelled.',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            __v:       { type: 'integer', example: 0 },
          },
        },

        // ─── Mobile App ───────────────────────────────────────────────────────
        CustomerLoginResponse: {
          type: 'object',
          properties: {
            _id:             { type: 'string' },
            name:            { type: 'string' },
            email:           { type: 'string' },
            phone:           { type: 'string' },
            role:            { type: 'string', example: 'user' },
            isPhoneVerified: { type: 'boolean' },
            loyaltyPoints:   { type: 'integer' },
            tier:            { type: 'string', example: 'Bronze' },
            permissions:     { type: 'array', items: { type: 'string' } },
            token:           { type: 'string' },
          },
        },

        // ─── Driver App ───────────────────────────────────────────────────────
        DriverLoginResponse: {
          type: 'object',
          properties: {
            _id:               { type: 'string' },
            name:              { type: 'string' },
            phone:             { type: 'string' },
            vehicleType:       { type: 'string' },
            status:            { type: 'string' },
            assignedZone:      { type: 'string' },
            performanceRating: { type: 'number' },
            token:             { type: 'string' },
          },
        },

        // ─── Mobile — Cart ────────────────────────────────────────────────────
        Cart: {
          type: 'object',
          properties: {
            items:     { type: 'array', items: { type: 'object' } },
            total:     { type: 'number', example: 110.00 },
            itemCount: { type: 'integer', example: 2 },
          },
        },
      },
    },
    tags: [
      // ─── Customer Mobile App ─────────────────────────────────────────────
      { name: 'Mobile — Auth',          description: 'Customer App: phone-based registration and login (/api/mobile/auth/*)' },
      { name: 'Mobile — Profile',       description: 'Customer App: profile, loyalty, favorites (/api/mobile/profile/*)' },
      { name: 'Mobile — Addresses',     description: 'Customer App: saved delivery addresses (/api/mobile/addresses/*)' },
      { name: 'Mobile — Products',      description: 'Customer App: browse menu products — public (/api/mobile/products/*)' },
      { name: 'Mobile — Categories',    description: 'Customer App: menu categories — public (/api/mobile/categories)' },
      { name: 'Mobile — Cart',          description: 'Customer App: shopping cart (/api/mobile/cart/*)' },
      { name: 'Mobile — Orders',        description: 'Customer App: place, track, and review orders (/api/mobile/orders/*)' },
      { name: 'Mobile — Notifications', description: 'Customer App: push notifications inbox (/api/mobile/notifications/*)' },
      { name: 'Mobile — Offers',        description: 'Customer App: active promotions and coupon validation (/api/mobile/offers/*)' },
      { name: 'Mobile — Reviews',       description: 'Customer App: submit and view order reviews (/api/mobile/reviews/*)' },
      { name: 'Mobile — Zones',         description: 'Customer App: delivery zones and fee lookup — public (/api/mobile/zones/*)' },
      { name: 'Mobile — Search',        description: 'Customer App: search history and trending (/api/mobile/search/*)' },
      // ─── Driver Mobile App ───────────────────────────────────────────────
      { name: 'Drivers',                description: 'Driver App: auth, shift, orders, location, notifications (/api/driver/* or /api/drivers/*)' },
      // ─── Dashboard ───────────────────────────────────────────────────────
      { name: 'Auth',                   description: 'Dashboard: customer phone-based auth (/api/auth/*)' },
      { name: 'Auth — Dashboard',       description: 'Dashboard: staff/admin email login (/api/auth/admin/*)' },
      { name: 'Logistics',              description: 'Dashboard: driver dispatch and management (/api/logistics/*)' },
      { name: 'Orders',                 description: 'Dashboard: all orders (/api/orders/*)' },
      { name: 'Products',               description: 'Dashboard: menu product management (/api/products/*)' },
      { name: 'Categories',             description: 'Dashboard: menu categories (/api/categories/*)' },
      { name: 'Offers',                 description: 'Dashboard: promotional offers management (/api/offers/*)' },
      { name: 'Reviews',                description: 'Dashboard: customer reviews management (/api/reviews/*)' },
      { name: 'Zones',                  description: 'Dashboard: delivery zone management (/api/zones/*)' },
      { name: 'Users',                  description: 'Dashboard: staff user management (/api/users/*)' },
      { name: 'Kitchen',                description: 'Dashboard: kitchen order status (/api/kitchen/*)' },
      { name: 'Reports',                description: 'Dashboard: sales and performance reports (/api/reports/*)' },
      { name: 'Tables',                 description: 'Dashboard: dining tables (/api/tables/*)' },
      { name: 'Reservations',           description: 'Dashboard: table reservations (/api/reservations/*)' },
      { name: 'Customers',              description: 'Dashboard: customer CRM (/api/customers/*)' },
      { name: 'Coupons',                description: 'Dashboard: coupon codes (/api/coupons/*)' },
      { name: 'Financial',              description: 'Dashboard: financial transactions (/api/financial/*)' },
      { name: 'POS Shifts',             description: 'Dashboard: cashier shift management (/api/pos/*)' },
      { name: 'Inventory',              description: 'Dashboard: inventory management (/api/inventory/*)' },
      { name: 'Suppliers',              description: 'Dashboard: supplier management (/api/suppliers/*)' },
      { name: 'Notifications',          description: 'Dashboard: system notifications (/api/notifications/*)' },
    ],
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

module.exports = { swaggerOptions };
