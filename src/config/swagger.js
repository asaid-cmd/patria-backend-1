const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Patria Coffee & Beans — Full API',
      version: '2.0.0',
      description: `
## API Documentation — 3 Applications

**Response format:** All responses are **flat JSON** — same format as ERB. No wrapper object.

---

### Success Response
Returns the data object directly:
\`\`\`json
{ "_id": "...", "name": "Ahmed", "token": "eyJ..." }
\`\`\`
Or a message when there is no data:
\`\`\`json
{ "message": "تم الحذف بنجاح" }
\`\`\`

### Error Response
\`\`\`json
{ "message": "رقم الهاتف مستخدم بالفعل" }
\`\`\`

---

### Dashboard (Admin / POS / Kitchen)
Base: \`/api/*\`

Staff roles: SUPER_ADMIN, ADMIN, MANAGER, CASHIER, KITCHEN, STAFF.
Login with **email + password** — returns flat user object with \`token\`.

Key paths: \`/api/auth/admin/login\`, \`/api/orders\`, \`/api/products\`, \`/api/logistics/*\`, \`/api/reports/*\`

---

### Customer Mobile App
Base: \`/api/mobile/*\`

Login with **phone + password** — returns \`{ _id, name, phone, role, loyaltyPoints, tier, token }\`.

Key paths: \`/api/mobile/auth/login\`, \`/api/mobile/cart\`, \`/api/mobile/orders\`, \`/api/mobile/offers\`, \`/api/mobile/zones\`

---

### Driver Mobile App
Base: \`/api/driver/*\` or \`/api/drivers/*\` (both work)

Login with **phone + password** — returns \`{ _id, name, phone, vehicleType, status, token }\`.

Key paths: \`/api/driver/login\`, \`/api/driver/shift/start\`, \`/api/driver/orders\`, \`/api/driver/location\`

---

### Authentication Header
All protected endpoints require: \`Authorization: Bearer {token}\`
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
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'رقم الهاتف مستخدم بالفعل' },
          },
        },
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
        Cart: {
          type: 'object',
          properties: {
            items:     { type: 'array', items: { type: 'object' } },
            total:     { type: 'number', example: 110.00 },
            itemCount: { type: 'integer', example: 2 },
          },
        },
        OkResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
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
