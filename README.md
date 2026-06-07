# Patria Restaurant Management Backend API

Complete REST API for the Patria restaurant management dashboard built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Complete REST API** with 100+ endpoints
- **JWT Authentication** with access & refresh tokens
- **MongoDB** integration with 19 models
- **WebSocket** support for real-time kitchen updates
- **File Upload** support for images (Multer)
- **Email Notifications** (Nodemailer)
- **WhatsApp Notifications** integration
- **Swagger API Documentation**
- **Postman Collection** for easy testing
- **Rate Limiting** and Security middleware
- **Comprehensive Error Handling**

## 📋 Requirements

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm or yarn

## ⚙️ Installation

### 1. Clone & Setup

```bash
cd patria-backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Key Environment Variables:**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/patria
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CORS_ORIGIN=http://localhost:3000
```

### 3. MongoDB Setup

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas Cloud:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/patria
```

### 4. Seed Database

```bash
npm run seed
```

This creates:
- Admin user (email: `admin@patria.com`, password: `password123`)
- Default location
- 5 categories (Coffee, Pastries, etc.)
- 5 sample products
- 7 tables
- 3 sample customers

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Documentation

### Swagger UI
Visit `http://localhost:5000/api-docs` for interactive API documentation

### Health Check
```bash
curl http://localhost:5000/api/health
```

## 🧪 Testing with Postman

1. Import `postman_collection.json` into Postman
2. Set variables:
   - `BASE_URL`: `http://localhost:5000`
   - `ACCESS_TOKEN`: From login response
3. Start testing endpoints

## 🔐 Authentication

### Login Flow
```bash
POST /api/auth/login
{
  "email": "admin@patria.com",
  "password": "password123"
}

Response:
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Using Tokens
All authenticated requests require:
```
Authorization: Bearer <ACCESS_TOKEN>
```

### Refresh Token
```bash
POST /api/auth/refresh
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```

## 📡 WebSocket Integration

### Connect to Kitchen Socket
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken
  }
});

// Join kitchen
socket.emit('kitchen:join', { userId: 'user-id' });

// Listen for new orders
socket.on('kitchen:new-order', (order) => {
  console.log('New order:', order);
});

// Update order status
socket.emit('kitchen:order-status-update', {
  orderId: 'order-id',
  status: 'ready'
});
```

## 🗂️ Project Structure

```
patria-backend/
├── src/
│   ├── config/          # Database & app config
│   ├── middleware/      # Auth, upload, error handling
│   ├── models/          # 19 MongoDB models
│   ├── controllers/     # Business logic (15+ controllers)
│   ├── routes/          # API routes (18 route files)
│   ├── services/        # Email, WhatsApp, Socket, Upload
│   ├── socket/          # WebSocket handlers
│   ├── utils/           # Helpers, validators, pagination
│   └── app.js          # Express app setup
├── scripts/
│   └── seed.js         # Database seeding
├── uploads/            # Uploaded files
├── server.js           # Entry point
├── package.json
├── .env.example
└── postman_collection.json
```

## 📊 Database Models

1. **User** - Staff/admin users
2. **RefreshToken** - Token management
3. **Location** - Restaurant branches
4. **Table** - Dining tables
5. **Reservation** - Customer reservations
6. **Product** - Menu items
7. **Category** - Product categories
8. **Extra** - Product add-ons
9. **Order** - Customer orders
10. **OrderItem** - Order items (subdocument)
11. **Offer** - Promotional offers
12. **Coupon** - Discount coupons
13. **Customer** - App customers
14. **Subscription** - Recurring subscriptions
15. **Transaction** - Financial transactions
16. **Shift** - POS shifts
17. **Supplier** - Vendor management
18. **Warehouse** - Inventory storage
19. **Notification** - User notifications
20. **Review** - Product reviews
21. **PurchaseOrder** - Supplier orders

## 🔌 API Endpoints Summary

### Auth (7 endpoints)
- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/reset-password` - Set new password

### Users (5 endpoints)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/role` - Change role

### Products (5 endpoints)
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders (5 endpoints)
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update status
- `DELETE /api/orders/:id` - Delete order

### Tables (4 endpoints)
- `GET /api/tables` - List tables
- `POST /api/tables` - Create table
- `PUT /api/tables/:id` - Update status
- `DELETE /api/tables/:id` - Delete table

### Reservations (4 endpoints)
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update status
- `DELETE /api/reservations/:id` - Delete reservation

### Financial (3 endpoints)
- `GET /api/financial/overview` - Financial overview
- `GET /api/financial/transactions` - Get transactions
- `POST /api/financial/transactions` - Create transaction

### Kitchen (2 endpoints)
- `GET /api/kitchen/orders` - Live orders
- `PUT /api/kitchen/orders/:id` - Update status

### Customers, Subscriptions, Offers, Coupons, Reports, etc.
**Total: 100+ endpoints**

See Swagger docs at `/api-docs` for complete list

## 🔑 Key Role-Based Access

- **SUPER_ADMIN**: Full access
- **ADMIN**: Manage users, products, reports
- **MANAGER**: Manage staff, view reports
- **CASHIER**: Create orders, manage shifts
- **KITCHEN**: View & update orders
- **STAFF**: Limited access

## 🚨 Error Handling

API returns standard response format:
```json
{
  "success": true/false,
  "message": "Success or error message",
  "data": {}
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## 📝 File Upload

Images are stored locally in `./uploads/` directory

Supported formats: JPEG, PNG, WebP
Max file size: 5MB

## 🧪 Testing

### Manual Testing
1. Use Postman collection
2. Or use `curl` commands
3. Or frontend integration

### Example curl request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@patria.com","password":"password123"}'
```

## 🚀 Deployment

### Docker (Recommended)
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t patria-backend .
docker run -p 5000:5000 -e MONGODB_URI=... patria-backend
```

### Heroku
```bash
heroku create patria-backend
git push heroku main
```

### DigitalOcean, AWS, etc.
1. Install Node.js & MongoDB
2. Clone repository
3. Set environment variables
4. Run `npm install`
5. Run `npm start`

## 📧 Email Setup

For Gmail:
1. Enable 2FA
2. Create app password
3. Use app password in `.env`

## 🔄 Performance Tips

1. Enable database indexing
2. Use caching for frequently accessed data
3. Implement pagination (default: 10 items)
4. Rate limiting enabled (100 requests/15 min)
5. Enable compression middleware

## 🤝 Frontend Integration

### React Example
```javascript
const API_URL = 'http://localhost:5000/api';

const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  localStorage.setItem('accessToken', data.accessToken);
  return data;
};

const getOrders = async () => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_URL}/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
```

## 📞 Support

For issues or questions:
1. Check API documentation at `/api-docs`
2. Review Postman collection
3. Check `.env` configuration
4. Ensure MongoDB is running
5. Check server logs for errors

## 📄 License

ISC

---

**Built with ❤️ for Patria Restaurant Management**
