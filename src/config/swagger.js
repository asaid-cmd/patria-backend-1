const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Patria Coffee & Beans — Full API',
      version: '2.0.0',
      description: `
## API Documentation

### Apps covered:
- **Dashboard** (Admin / POS / Kitchen)
- **Customer Mobile App** — \`/api/auth\`, \`/api/cart\`, \`/api/orders\`, \`/api/v2/*\`
- **Driver Mobile App** — \`/api/drivers\`

### Authentication
- **Dashboard / Staff**: Login with email → get \`accessToken\`
- **Customer App**: Login with phone → get \`token\`
- **Driver App**: Login with phone → get \`token\`

All protected endpoints require: \`Authorization: Bearer {token}\`
      `,
    },
    servers: [
      {
        url: 'https://api.patriacoffeebeans.com/api',
        description: 'Production Server',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from login (staff accessToken or customer/driver token)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            statusCode: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Customer registration & login (phone-based)' },
      { name: 'Auth — Dashboard', description: 'Staff/Admin login (email-based)' },
      { name: 'Profile', description: 'Customer profile, loyalty, favorites' },
      { name: 'Products', description: 'Menu products (public)' },
      { name: 'Categories', description: 'Menu categories (public)' },
      { name: 'Cart', description: 'Customer shopping cart' },
      { name: 'Orders', description: 'Orders — create, track, history' },
      { name: 'Addresses', description: 'Customer saved addresses (v2)' },
      { name: 'Notifications', description: 'Customer push notifications (v2)' },
      { name: 'Search', description: 'Customer search history & trending (v2)' },
      { name: 'Zones', description: 'Delivery zones (public)' },
      { name: 'Offers', description: 'Promotions & coupon validation' },
      { name: 'Reviews', description: 'Order reviews' },
      { name: 'Drivers', description: 'Driver mobile app — auth, shift, orders, location' },
      { name: 'Logistics', description: 'Dashboard — driver dispatch & management' },
      { name: 'Users', description: 'Dashboard staff management' },
      { name: 'Kitchen', description: 'Kitchen order status' },
      { name: 'Reports', description: 'Dashboard reports' },
    ],
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

module.exports = { swaggerOptions };
