const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Patria Coffee & Beans — Full API',
      version: '2.0.0',
      description: `
# Patria Coffee & Beans — API Documentation

**Base URL (Dashboard):** \`https://api.patriacoffeebeans.com/api\`

**Base URL (Mobile App):** \`https://api.patriacoffeebeans.com/api/mobile\`

**Base URL (Driver App):** \`https://api.patriacoffeebeans.com/api/driver\`

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**How to get a token:**
1. Call \`POST /auth/admin/login\` with \`{ email, password }\`
2. You receive \`accessToken\` (valid 15 min) + \`refreshToken\` (valid 7 days)
3. When the access token expires (401 response), call \`POST /auth/refresh\` with the refresh token to get a new one

---

## Response Format

### Success — returns data directly:
\`\`\`json
{ "location": { "_id": "...", "name": "Downtown", "deliveryFee": 15 } }
\`\`\`

### Success — paginated list:
\`\`\`json
{
  "data": [ {...}, {...} ],
  "pagination": { "total": 25, "page": 1, "limit": 10, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
\`\`\`

### Success — delete (no data):
\`\`\`json
{ "message": "Item deleted" }
\`\`\`

### POST /auth/refresh — special wrapped format:
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "message": "Token refreshed successfully",
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
\`\`\`

### Error:
\`\`\`json
{ "message": "Invalid credentials" }
\`\`\`

---

## Staff Roles

| Role | Value | Permissions |
|------|-------|-------------|
| Super Admin | \`superadmin\` | Full access to everything |
| Admin | \`admin\` | Users, content, settings |
| Manager | \`manager\` | Staff, reports, operations |
| Cashier | \`cashier\` | Orders and POS shifts |
| Kitchen | \`kitchen\` | View and update order status |
| Staff | \`staff\` | Limited read-only access |

---

## Dashboard Endpoints

### Auth
| Method | Path | Requires Token | Description |
|--------|------|----------------|-------------|
| POST | /auth/admin/register | No | Create admin account |
| POST | /auth/admin/login | No | Login — returns accessToken + refreshToken |
| POST | /auth/refresh | No | Refresh expired access token |
| POST | /auth/logout | Yes | Logout current session |
| GET | /auth/me | Yes | Get current logged-in user |
| POST | /auth/forgot-password | No | Send password reset email — body: \`{ email }\` |

### Categories
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /categories | All | Returns direct array of active categories with product counts |
| POST | /categories | ADMIN, MANAGER | Create category |
| PUT | /categories/:id | ADMIN, MANAGER | Update category (name, order, isActive, icon) |
| DELETE | /categories/:id | ADMIN, MANAGER | Soft delete — sets isActive = false |

### Locations (Delivery Zones)
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /locations | All | Get all zones + stats (total, active, inactive) |
| POST | /locations | ADMIN, MANAGER | Create delivery zone |
| PUT | /locations/:id | ADMIN, MANAGER | Update zone details |
| PATCH | /locations/:id/toggle | ADMIN, MANAGER | Toggle zone on/off — body: \`{ isActive: false }\` |
| DELETE | /locations/:id | ADMIN | Delete zone permanently |

### Products
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /products | All | Paginated products list with variantGroups + extras |
| GET | /products/:id | All | Single product details |
| POST | /products | ADMIN, MANAGER | Create product — use multipart/form-data for images |
| PUT | /products/:id | ADMIN, MANAGER | Update product |
| DELETE | /products/:id | ADMIN, MANAGER | Soft delete — sets isActive = false |

### Tables
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /tables | All | Paginated list of dining tables |
| POST | /tables | ADMIN, MANAGER | Create table |
| PUT | /tables/:id | ADMIN, MANAGER, CASHIER | Update table status (available / occupied) |
| DELETE | /tables/:id | ADMIN, MANAGER | Delete table permanently |

### Reservations
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /reservations | All | Paginated list — filter by \`?date=YYYY-MM-DD\` or \`?status=on_hold\` |
| POST | /reservations | All | Create reservation |
| PUT | /reservations/:id | ADMIN, MANAGER | Update status (on_hold → confirmed → sitting → ended) |
| DELETE | /reservations/:id | ADMIN, MANAGER | Delete reservation |

---

## Customer Mobile App (/api/mobile/*)

Login: \`POST /mobile/auth/login\` with phone + password

Key endpoints: \`/mobile/products\`, \`/mobile/categories\`, \`/mobile/cart\`, \`/mobile/orders\`, \`/mobile/offers\`, \`/mobile/zones\`

---

## Driver App (/api/driver/*)

Login: \`POST /drivers/login\` with phone + password

Key endpoints: \`/driver/shift/start\`, \`/driver/orders\`, \`/driver/location\`
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
          description: 'Category item as returned by GET /categories (Direct array — no wrapper object)',
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

        // ─── Products ─────────────────────────────────────────────────────────
        VariantOption: {
          type: 'object',
          description: 'A single option inside a variant group (e.g. Small, Medium, Large)',
          properties: {
            _id:             { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d7' },
            id:              { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d7' },
            name:            { type: 'string', example: 'Medium' },
            priceAdjustment: { type: 'number', description: 'Amount added to (+) or subtracted from (-) the base price', example: 5 },
          },
        },

        VariantGroup: {
          type: 'object',
          description: 'An option group — e.g. Size or Milk Type',
          properties: {
            _id:      { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d6' },
            id:       { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d6' },
            name:     { type: 'string', example: 'Size' },
            required: { type: 'boolean', description: 'Whether the customer must choose an option', example: true },
            options:  { type: 'array', items: { '$ref': '#/components/schemas/VariantOption' } },
          },
        },

        ProductExtra: {
          type: 'object',
          description: 'An optional add-on with an individual price',
          properties: {
            _id:      { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0da' },
            id:       { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0da' },
            name:     { type: 'string', example: 'Extra Shot' },
            price:    { type: 'number', example: 5 },
            isActive: { type: 'boolean', example: true },
          },
        },

        ProductFull: {
          type: 'object',
          description: 'Full product object returned by GET /products and GET /products/:id',
          properties: {
            _id:         { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d5' },
            id:          { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d5' },
            name:        { type: 'string', example: 'Caramel Latte' },
            description: { type: 'string', example: 'Espresso with steamed milk and caramel syrup' },
            price:       { type: 'number', example: 65 },
            category:    { type: 'string', description: 'Category name string (not the ID)', example: 'Coffee' },
            image:       { type: 'string', description: 'First image URL only', example: 'uploads/products/latte.jpg', nullable: true },
            isActive:    { type: 'boolean', example: true },
            inventory:   { type: 'integer', example: 100 },
            totalInventory: { type: 'integer', example: 100 },
            lowStockThreshold: { type: 'integer', example: 10 },
            rate:        { type: 'number', example: 4.5 },
            reviewsCount:{ type: 'integer', example: 12 },
            costPrice:   { type: 'number', example: 25 },
            barcode:     { type: 'string', nullable: true },
            isIngredient:{ type: 'boolean', example: false },
            unit:        { type: 'string', example: 'pcs' },
            haveCustomizationOption: {
              type: 'boolean',
              description: 'true if the product has at least one variant group',
              example: true,
            },
            hasRecipe:   { type: 'boolean', example: false },
            variantGroups: {
              type: 'array',
              description: 'Option groups (size, milk type, etc.) with price adjustments per option',
              items: { '$ref': '#/components/schemas/VariantGroup' },
            },
            extras: {
              type: 'array',
              description: 'Optional add-ons with individual prices',
              items: { '$ref': '#/components/schemas/ProductExtra' },
            },
            customizationOptions: {
              type: 'object',
              description: 'Fixed coffee customization options — always returned by the server, never sent in requests',
              properties: {
                roastLevels: { type: 'array', items: { type: 'string' }, example: ['Light', 'Medium', 'Dark'] },
                grindTypes:  { type: 'array', items: { type: 'string' }, example: ['Whole Bean', 'Espresso', 'Filter'] },
              },
            },
            sizes:       { type: 'array', items: { type: 'object' }, example: [] },
            locationStock: { type: 'array', items: { type: 'object' }, example: [] },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
            __v:         { type: 'integer', example: 0 },
          },
        },

        ProductStored: {
          type: 'object',
          description: 'Product as stored in MongoDB — returned by POST/PUT /products',
          properties: {
            _id:               { type: 'string' },
            name:              { type: 'string', example: 'Caramel Latte' },
            description:       { type: 'string' },
            price:             { type: 'number', example: 65 },
            cost:              { type: 'number', example: 25 },
            categoryId:        { type: 'string', description: 'Category ObjectId' },
            isActive:          { type: 'boolean', example: true },
            stockQty:          { type: 'integer', example: 100 },
            lowStockThreshold: { type: 'integer', example: 10 },
            images:            { type: 'array', items: { type: 'string' }, example: ['uploads/products/latte.jpg'] },
            variantGroups:     { type: 'array', items: { '$ref': '#/components/schemas/VariantGroup' } },
            extras:            { type: 'array', items: { '$ref': '#/components/schemas/ProductExtra' } },
            createdAt:         { type: 'string', format: 'date-time' },
            updatedAt:         { type: 'string', format: 'date-time' },
            __v:               { type: 'integer', example: 0 },
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
