# Patria Backend — API Documentation

## Base Info

| | |
|-|-|
| **Base URL** | `https://api.patriacoffeebeans.com/api` |
| **Content-Type** | `application/json` (except file uploads → `multipart/form-data`) |
| **Auth Header** | `Authorization: Bearer {accessToken}` |

---

## Authentication Flow

1. Call `POST /api/auth/login` → get `accessToken` (expires in 15 min) + `refreshToken` (expires in 7 days)
2. Attach `accessToken` to every request header
3. When `accessToken` expires → call `POST /api/auth/refresh` with `refreshToken` to get a new one

---

## Standard Response Format

Every response follows this structure:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": { }
}
```

**Error example:**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation error: email is required",
  "data": null
}
```

---

## Roles & Permissions

| Role | Access Level |
|------|-------------|
| `SUPER_ADMIN` | Full access — no restrictions |
| `ADMIN` | Full management except some SUPER_ADMIN-only actions |
| `MANAGER` | Daily operations, reports, staff management |
| `CASHIER` | Orders, shifts, dispatch |
| `KITCHEN` | Kitchen orders only |
| `STAFF` | Limited read access |

---

---

# 1. Authentication — `/api/auth`

---

### `POST /api/auth/register`
> Register a new admin user

**No auth required**

```json
// Request Body
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "123456"
}
```

```json
// Response
{
  "data": {
    "user": { "_id": "...", "name": "Ahmed", "email": "...", "role": "ADMIN" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### `POST /api/auth/login`
> Login with email and password

**No auth required**

```json
// Request Body
{
  "email": "ahmed@example.com",
  "password": "123456"
}
```

```json
// Response
{
  "data": {
    "user": { "_id": "...", "name": "Ahmed", "role": "ADMIN" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### `POST /api/auth/refresh`
> Get a new accessToken using refreshToken

**No auth required**

```json
// Request Body
{
  "refreshToken": "eyJ..."
}
```

```json
// Response
{
  "data": { "accessToken": "eyJ..." }
}
```

---

### `POST /api/auth/logout`
> Logout current user

**Auth required**

```json
// No body
// Response: { "message": "Logged out successfully" }
```

---

### `GET /api/auth/me`
> Get current logged-in user info

**Auth required**

```json
// Response
{
  "data": {
    "_id": "...",
    "name": "Ahmed",
    "email": "ahmed@example.com",
    "role": "ADMIN",
    "locationId": "..."
  }
}
```

---

### `POST /api/auth/forgot-password`
> Send a password reset email

**No auth required**

```json
// Request Body
{
  "email": "ahmed@example.com"
}
```

---

---

# 2. Users — `/api/users`

> Manage staff accounts

**Auth required — Role: `ADMIN` or `SUPER_ADMIN`**

---

### `GET /api/users`
> Get all staff users

```json
// Response
{
  "data": [
    { "_id": "...", "name": "...", "email": "...", "role": "CASHIER", "locationId": "..." }
  ]
}
```

---

### `POST /api/users`
> Create a new staff user

```json
// Request Body
{
  "name": "Mohammed",
  "email": "mo@example.com",
  "password": "123456",
  "role": "CASHIER",       // SUPER_ADMIN | ADMIN | MANAGER | CASHIER | KITCHEN | STAFF
  "locationId": "abc123"   // optional
}
```

---

### `PUT /api/users/:id`
> Update a staff user

```json
// Request Body (all fields optional)
{
  "name": "...",
  "email": "...",
  "password": "...",
  "role": "...",
  "phone": "..."
}
```

---

### `DELETE /api/users/:id`
> Delete a staff user

---

---

# 3. Tables — `/api/tables`

---

### `GET /api/tables`
> Get all tables

**Auth required**

```
Query Params:
  locationId  (optional)
  status      (optional) → available | occupied | reserved | cleaning
```

```json
// Response
{
  "data": [
    { "_id": "...", "number": 5, "capacity": 4, "status": "available", "section": "outdoor" }
  ]
}
```

---

### `POST /api/tables`
> Create a new table

**Role: `ADMIN` | `MANAGER`**

```json
{
  "number": 5,
  "capacity": 4,
  "locationId": "abc123",
  "section": "outdoor",   // optional
  "notes": "..."          // optional
}
```

---

### `PUT /api/tables/:id`
> Update table details or status

**Role: `ADMIN` | `MANAGER` | `CASHIER`**

```json
// All fields optional
{
  "status": "occupied",   // available | occupied | reserved | cleaning
  "capacity": 6,
  "section": "...",
  "notes": "..."
}
```

---

### `DELETE /api/tables/:id`
> Delete a table

**Role: `ADMIN` | `MANAGER`**

---

---

# 4. Reservations — `/api/reservations`

---

### `GET /api/reservations`
> Get all reservations

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  date    → e.g. 2026-06-22
  status  → pending | confirmed | cancelled | completed
```

---

### `POST /api/reservations`
> Create a new reservation

**Auth required**

```json
{
  "customerName": "Ali",
  "date": "2026-06-25",
  "time": "19:00",
  "guestCount": 4,
  "customerPhone": "01012345678",  // optional
  "customerEmail": "...",          // optional
  "tableId": "abc123",             // optional
  "notes": "..."                   // optional
}
```

---

### `PUT /api/reservations/:id`
> Update reservation status

**Role: `ADMIN` | `MANAGER`**

```json
{
  "status": "confirmed",   // pending | confirmed | cancelled | completed
  "notes": "..."           // optional
}
```

---

### `DELETE /api/reservations/:id`
> Delete a reservation

**Role: `ADMIN` | `MANAGER`**

---

---

# 5. Orders — `/api/orders`

---

### `GET /api/orders`
> Get all orders

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  status  → pending | confirmed | preparing | ready | delivered | cancelled
  type    → dine-in | takeaway | delivery
```

---

### `GET /api/orders/:id`
> Get a single order by ID

**Auth required**

---

### `POST /api/orders`
> Create a new order

**Role: `CASHIER` | `STAFF` | `ADMIN` | `MANAGER`**

```json
{
  "items": [
    {
      "productId": "abc123",
      "quantity": 2,
      "notes": "no sugar"   // optional
    }
  ],
  "type": "dine-in",         // dine-in | takeaway | delivery
  "tableId": "abc123",       // optional — required for dine-in
  "customerId": "abc123",    // optional
  "couponCode": "SAVE10",    // optional
  "notes": "...",            // optional
  "locationId": "abc123"     // optional
}
```

---

### `PUT /api/orders/:id`
> Update order status

**Auth required**

```json
{
  "status": "confirmed",   // pending | confirmed | preparing | ready | delivered | cancelled
  "notes": "..."           // optional
}
```

---

### `DELETE /api/orders/:id`
> Delete an order

**Role: `ADMIN` | `MANAGER`**

---

---

# 6. Products — `/api/products`

---

### `GET /api/products`
> Get all products

**Auth required**

```
Query Params:
  page        (default: 1)
  limit       (default: 10)
  categoryId  (optional)
  search      (optional) — searches by name
  isActive    (optional) → true | false
```

---

### `POST /api/products`
> Create a new product

**Role: `ADMIN` | `MANAGER`**
**Content-Type: `multipart/form-data`**

```
name          (required)
price         (required, number)
categoryId    (required)
description   (optional)
cost          (optional, number)
isActive      (optional, boolean — default: true)
images        (optional, up to 5 image files)
```

---

### `PUT /api/products/:id`
> Update a product

**Role: `ADMIN` | `MANAGER`**
**Content-Type: `multipart/form-data`**

Same fields as POST — all optional

---

### `DELETE /api/products/:id`
> Delete a product

**Role: `ADMIN` | `MANAGER`**

---

---

# 7. Categories — `/api/categories`

---

### `GET /api/categories`
> Get all categories

**Auth required**

```json
// Response
{
  "data": [
    { "_id": "...", "name": "Hot Drinks", "icon": "☕", "order": 1, "isActive": true }
  ]
}
```

---

### `POST /api/categories`
> Create a new category

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Hot Drinks",
  "description": "...",  // optional
  "icon": "☕",           // optional
  "order": 1             // optional — for sorting
}
```

---

### `PUT /api/categories/:id`
> Update a category

**Role: `ADMIN` | `MANAGER`**

```json
// All fields optional
{
  "name": "...",
  "description": "...",
  "icon": "...",
  "order": 2,
  "isActive": false
}
```

---

### `DELETE /api/categories/:id`
> Delete a category

**Role: `ADMIN` | `MANAGER`**

---

---

# 8. Offers — `/api/offers`

---

### `GET /api/offers`
> Get all promotional offers

**Auth required**

```
Query Params:
  page      (default: 1)
  limit     (default: 10)
  isActive  → true | false
```

---

### `POST /api/offers`
> Create a new offer

**Role: `ADMIN` | `MANAGER`**
**Content-Type: `multipart/form-data`**

```
title          (required)
discountType   (required) → percentage | fixed
discountValue  (required, number)
description    (optional)
startDate      (optional)
endDate        (optional)
bannerImage    (optional, image file)
```

---

### `PUT /api/offers/:id`
> Update an offer

**Role: `ADMIN` | `MANAGER`**
**Content-Type: `multipart/form-data`**

Same fields as POST — all optional

---

### `PATCH /api/offers/:id/toggle`
> Toggle offer active/inactive

**Role: `ADMIN` | `MANAGER`**

```json
// No body needed
```

---

### `DELETE /api/offers/:id`
> Delete an offer

**Role: `ADMIN` | `MANAGER`**

---

---

# 9. Coupons — `/api/coupons`

---

### `GET /api/coupons`
> Get all coupons

**Auth required**

---

### `POST /api/coupons`
> Create a new coupon

**Role: `ADMIN` | `MANAGER`**

```json
{
  "code": "SAVE10",
  "discountType": "percentage",   // percentage | fixed
  "discountValue": 10,
  "minOrderAmount": 50,           // optional
  "maxUses": 100,                 // optional
  "expiresAt": "2026-12-31"       // optional
}
```

---

### `PUT /api/coupons/:id`
> Update a coupon

**Role: `ADMIN` | `MANAGER`**

```json
// All fields optional
{
  "code": "...",
  "discountType": "...",
  "discountValue": 0,
  "minOrderAmount": 0,
  "maxUses": 0,
  "expiresAt": "...",
  "isActive": true
}
```

---

### `DELETE /api/coupons/:id`
> Delete a coupon

**Role: `ADMIN` | `MANAGER`**

---

---

# 10. Customers — `/api/customers`

---

### `GET /api/customers`
> Get all customers

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  search  (optional) — search by name or phone
```

---

### `GET /api/customers/stats`
> Get customer statistics

**Auth required**

```json
// Response example
{
  "data": {
    "totalCustomers": 320,
    "newThisMonth": 40,
    "loyaltyStats": { ... }
  }
}
```

---

### `PUT /api/customers/:id`
> Update a customer

**Role: `ADMIN` | `MANAGER`**

```json
// All fields optional (at least 1 required)
{
  "name": "...",
  "phone": "...",
  "email": "...",
  "loyaltyPoints": 100,
  "notes": "..."
}
```

---

### `DELETE /api/customers/:id`
> Delete a customer

**Role: `ADMIN` | `MANAGER`**

---

---

# 11. Subscriptions — `/api/subscriptions`

---

### `GET /api/subscriptions`
> Get all subscriptions

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  status  → active | paused | cancelled
```

---

### `GET /api/subscriptions/stats`
> Get subscription statistics

**Auth required**

---

### `POST /api/subscriptions`
> Create a new subscription

**Role: `ADMIN` | `MANAGER`**

```json
{
  "customerId": "abc123",
  "items": [
    { "productId": "xyz", "quantity": 2 }
  ],
  "frequency": "weekly",        // daily | weekly | biweekly | monthly
  "startDate": "2026-07-01",   // optional
  "deliveryAddress": "..."      // optional
}
```

---

### `PUT /api/subscriptions/:id`
> Update a subscription

**Role: `ADMIN` | `MANAGER`**

```json
// All fields optional
{
  "items": [...],
  "frequency": "monthly",
  "status": "paused",           // active | paused
  "deliveryAddress": "..."
}
```

---

### `DELETE /api/subscriptions/:id`
> Cancel a subscription

**Role: `ADMIN` | `MANAGER`**

---

---

# 12. Kitchen — `/api/kitchen`

---

### `GET /api/kitchen/orders`
> Get all active kitchen orders

**Role: `KITCHEN` | `ADMIN` | `MANAGER`**

```json
// Response
{
  "data": [
    {
      "_id": "...",
      "type": "dine-in",
      "tableId": "...",
      "status": "preparing",
      "items": [
        { "productId": "...", "name": "Espresso", "quantity": 2, "status": "pending" }
      ],
      "createdAt": "..."
    }
  ]
}
```

---

### `PUT /api/kitchen/orders/:id`
> Update kitchen order status

**Role: `KITCHEN` | `ADMIN` | `MANAGER`**

```json
{
  "status": "preparing",   // pending | preparing | ready | served
  "itemIndex": 0           // optional — update a specific item by its index in the items array
}
```

---

---

# 13. POS Shifts — `/api/pos/shifts`

---

### `POST /api/pos/shifts/open`
> Open a new cashier shift

**Role: `CASHIER` | `ADMIN` | `MANAGER`**

```json
{
  "openingCash": 500,
  "notes": "..."   // optional
}
```

---

### `PUT /api/pos/shifts/close`
> Close the current open shift

**Role: `CASHIER` | `ADMIN` | `MANAGER`**

```json
{
  "closingCash": 1200,
  "notes": "..."   // optional
}
```

```json
// Response includes shift summary
{
  "data": {
    "shift": { ... },
    "totalOrders": 45,
    "totalRevenue": 3200,
    "difference": 700
  }
}
```

---

### `GET /api/pos/shifts/current`
> Get the currently open shift

**Auth required**

---

### `GET /api/pos/shifts/:shiftId`
> Get a specific shift summary

**Auth required**

---

---

# 14. Financial — `/api/financial`

---

### `GET /api/financial/overview`
> Get financial summary

**Auth required**

```
Query Params:
  startDate  (optional) → e.g. 2026-01-01
  endDate    (optional) → e.g. 2026-06-30
```

```json
// Response
{
  "data": {
    "totalRevenue": 50000,
    "totalExpenses": 20000,
    "netProfit": 30000
  }
}
```

---

### `GET /api/financial/transactions`
> Get all financial transactions

**Auth required**

```
Query Params:
  page   (default: 1)
  limit  (default: 10)
  type   → income | expense
```

---

### `POST /api/financial/transactions`
> Record a new financial transaction

**Role: `ADMIN` | `MANAGER`**

```json
{
  "type": "expense",         // income | expense
  "amount": 500,
  "description": "...",  // optional
  "category": "...",     // optional
  "date": "2026-06-22"   // optional
}
```

---

---

# 15. Reports — `/api/reports`

**Role: `ADMIN` | `MANAGER` | `SUPER_ADMIN`**

---

### `GET /api/reports/overview`
> General business overview

```
Query Params:
  startDate  (optional)
  endDate    (optional)
```

---

### `GET /api/reports/employees`
> Employee performance report

```
Query Params:
  startDate   (optional)
  endDate     (optional)
  locationId  (optional)
```

---

### `GET /api/reports/branches`
> Branch performance report

```
Query Params:
  startDate  (optional)
  endDate    (optional)
```

---

### `GET /api/reports/analytics`
> Detailed analytics

```
Query Params:
  type       → sales | orders | customers | products
  startDate  (optional)
  endDate    (optional)
```

---

### `GET /api/reports/export`
> Export report as a file

```
Query Params:
  type       (required) → orders | customers | products | financial
  format     (optional) → csv | xlsx | pdf
  startDate  (optional)
  endDate    (optional)
```

> Returns a downloadable file

---

---

# 16. Locations — `/api/locations`

---

### `GET /api/locations`
> Get all branches/locations

**Auth required**

```json
// Response
{
  "data": [
    { "_id": "...", "name": "Main Branch", "address": "...", "isActive": true }
  ]
}
```

---

### `POST /api/locations`
> Create a new location

**Role: `ADMIN` | `SUPER_ADMIN` | `MANAGER`**

```json
{
  "name": "New Branch",
  "address": "123 Main St...",
  "phone": "...",   // optional
  "email": "..."    // optional
}
```

---

### `PUT /api/locations/:id`
> Update a location

**Role: `ADMIN` | `SUPER_ADMIN` | `MANAGER`**

```json
// All fields optional
{
  "name": "...",
  "address": "...",
  "phone": "...",
  "email": "..."
}
```

---

### `PATCH /api/locations/:id/toggle`
> Toggle location active/inactive

**Role: `ADMIN` | `SUPER_ADMIN` | `MANAGER`**

```json
// No body needed
```

---

### `DELETE /api/locations/:id`
> Delete a location

**Role: `ADMIN` | `SUPER_ADMIN`**

---

---

# 17. Suppliers — `/api/suppliers`

---

### `GET /api/suppliers`
> Get all suppliers

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  search  (optional) — search by name
```

---

### `POST /api/suppliers`
> Create a new supplier

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Coffee Supplier Co.",
  "contactPerson": "Mohammed",
  "phone": "01012345678",
  "email": "...",         // optional
  "address": "...",       // optional
  "taxNumber": "...",     // optional
  "paymentTerms": "...",  // optional
  "notes": "..."          // optional
}
```

---

### `PUT /api/suppliers/:id`
> Update a supplier

**Role: `ADMIN` | `MANAGER`**

Same fields as POST — all optional + `"isActive": true`

---

### `DELETE /api/suppliers/:id`
> Delete a supplier

**Role: `ADMIN` | `MANAGER`**

---

---

# 18. Inventory — `/api/inventory`

---

### `GET /api/inventory`
> Get all inventory items

**Auth required** — `?page=1&limit=10`

---

### `GET /api/inventory/shortages`
> Get low-stock alerts

**Auth required**

```json
// Response
{
  "data": [
    { "productName": "Coffee Beans", "currentStock": 5, "minRequired": 20 }
  ]
}
```

---

### `POST /api/inventory/synchronize`
> Sync inventory with current stock levels

**Role: `ADMIN` | `MANAGER`**

```json
// No body needed
```

---

### `PUT /api/inventory/:id/stock`
> Update stock for a single inventory item

**Role: `ADMIN` | `MANAGER`**

```json
{
  "quantity": 50,
  "reason": "..."   // optional
}
```

---

### `PUT /api/inventory/bulk-update`
> Update stock for multiple items at once

**Role: `ADMIN` | `MANAGER`**

```json
{
  "items": [
    { "id": "abc", "quantity": 20 },
    { "id": "xyz", "quantity": 10 }
  ]
}
```

---

---

# 19. Notifications — `/api/notifications`

---

### `GET /api/notifications`
> Get notifications for the logged-in user

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  unread  (optional) → true | false
```

---

### `PUT /api/notifications/:id/read`
> Mark a notification as read

**Auth required**

```json
// No body needed
```

---

---

# 20. Reviews — `/api/reviews`

---

### `GET /api/reviews`
> Get all customer reviews

**Auth required**

```
Query Params:
  page       (default: 1)
  limit      (default: 10)
  rating     (optional) → 1 | 2 | 3 | 4 | 5
  isVisible  (optional) → true | false
```

---

### `POST /api/reviews`
> Submit a customer review

**No auth required — Public endpoint**

```json
{
  "rating": 5,
  "comment": "Excellent service!",
  "customerName": "...",   // optional
  "customerPhone": "...",  // optional
  "orderId": "..."         // optional
}
```

---

### `PATCH /api/reviews/:id/visibility`
> Show or hide a review

**Role: `ADMIN` | `MANAGER`**

```json
// No body needed — toggles visibility
```

---

### `DELETE /api/reviews/:id`
> Delete a review

**Role: `ADMIN` | `MANAGER`**

---

---

# 21. Warehouses — `/api/warehouses`

---

### `GET /api/warehouses`
> Get all warehouses

**Auth required** — `?page=1&limit=10`

---

### `POST /api/warehouses`
> Create a new warehouse

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Main Warehouse",
  "address": "...",
  "phone": "...",    // optional
  "capacity": 1000,  // optional
  "notes": "..."     // optional
}
```

---

### `PUT /api/warehouses/:id`
> Update a warehouse

**Role: `ADMIN` | `MANAGER`**

Same fields as POST — all optional + `"isActive": true`

---

### `DELETE /api/warehouses/:id`
> Delete a warehouse

**Role: `ADMIN` | `MANAGER`**

---

### `GET /api/warehouses/transfers`
> Get all stock transfers

**Auth required**

```
Query Params:
  page    (default: 1)
  limit   (default: 10)
  status  → pending | in-transit | completed | cancelled
```

---

### `POST /api/warehouses/transfers`
> Create a stock transfer between warehouses

**Role: `ADMIN` | `MANAGER`**

```json
{
  "fromWarehouseId": "abc",
  "toWarehouseId": "xyz",
  "items": [
    { "productId": "...", "quantity": 10 }
  ],
  "scheduledDate": "2026-07-01",  // optional
  "notes": "..."                   // optional
}
```

---

### `PATCH /api/warehouses/transfers/:id/status`
> Update transfer status

**Role: `ADMIN` | `MANAGER`**

```json
{
  "status": "completed",   // pending | in-transit | completed | cancelled
  "notes": "..."           // optional
}
```

---

---

# 22. Purchasing — `/api/purchasing`

---

### `GET /api/purchasing`
> Get all purchase orders

**Auth required** — `?page=1&limit=10&status=...`

---

### `POST /api/purchasing`
> Create a new purchase order

**Role: `ADMIN` | `MANAGER`**

```json
{
  "supplierId": "abc123",
  "items": [
    {
      "productId": "...",
      "productName": "Coffee Beans",
      "quantity": 100,
      "unitCost": 25
    }
  ],
  "warehouseId": "...",            // optional
  "expectedDeliveryDate": "...",   // optional
  "notes": "..."                   // optional
}
```

---

### `POST /api/purchasing/:id/submit`
> Submit purchase order to supplier

**Role: `ADMIN` | `MANAGER`**

```json
// No body needed
```

---

### `POST /api/purchasing/:id/payment`
> Record a payment for a purchase order

**Role: `ADMIN` | `MANAGER`**

```json
{
  "amount": 5000,
  "paymentMethod": "cash",       // cash | bank_transfer | credit
  "referenceNumber": "...",      // optional
  "notes": "..."                 // optional
}
```

---

### `POST /api/purchasing/:id/receive`
> Mark a purchase order as received

**Role: `ADMIN` | `MANAGER`**

```json
{
  "receivedDate": "2026-06-22",  // optional
  "notes": "..."                 // optional
}
```

---

### `POST /api/purchasing/:id/cancel`
> Cancel a purchase order

**Role: `ADMIN` | `MANAGER`**

```json
{
  "reason": "..."   // optional
}
```

---

---

# 23. Pricing — `/api/pricing`

---

### `GET /api/pricing`
> Get all pricing rules

**Auth required**

---

### `POST /api/pricing/rules`
> Create a new pricing rule

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Bulk Discount",
  "type": "bulk_discount",             // bulk_discount | surcharge | loyalty_discount | seasonal
  "value": 15,
  "adjustmentType": "percentage",      // percentage | fixed
  "minQuantity": 10,                   // optional
  "applicableProductIds": ["..."],     // optional — empty means applies to all
  "startDate": "...",                  // optional
  "endDate": "..."                     // optional
}
```

---

### `PUT /api/pricing/rules/:id`
> Update a pricing rule

**Role: `ADMIN` | `MANAGER`**

Same fields as POST — all optional + `"isActive": true`

---

### `DELETE /api/pricing/rules/:id`
> Delete a pricing rule

**Role: `ADMIN` | `MANAGER`**

---

### `GET /api/pricing/pricelists`
> Get all price lists

**Auth required**

---

### `POST /api/pricing/pricelists`
> Create a new price list

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Wholesale Price List",
  "description": "...",   // optional
  "items": [
    { "productId": "...", "price": 45 }
  ]
}
```

---

### `PUT /api/pricing/pricelists/:id`
> Update a price list

**Role: `ADMIN` | `MANAGER`**

Same fields as POST — all optional

---

### `DELETE /api/pricing/pricelists/:id`
> Delete a price list

**Role: `ADMIN` | `MANAGER`**

---

---

# 24. Production — `/api/production`

---

### `GET /api/production/batches`
> Get all production batches

**Auth required** — `?page=1&limit=10&status=...`

---

### `POST /api/production/batches`
> Create a new production batch

**Role: `ADMIN` | `MANAGER`**

```json
{
  "productName": "Ethiopian Coffee",
  "roastingDegree": "medium",       // light | medium | dark
  "weightBefore": 100,              // optional, in kg
  "weightAfter": 85,                // optional, in kg
  "date": "2026-06-22",             // optional
  "ingredients": [
    { "name": "Green Beans", "quantity": 100, "unit": "kg" }
  ],
  "notes": "..."                    // optional
}
```

---

### `POST /api/production/batches/:id/quality-check`
> Run quality check on a batch

**Role: `ADMIN` | `MANAGER`**

```json
{
  "passed": true,
  "notes": "...",      // optional
  "checkedBy": "..."   // optional
}
```

---

### `PATCH /api/production/batches/:id/status`
> Update batch status

**Role: `ADMIN` | `MANAGER`**

```json
{
  "status": "in-progress"   // planned | in-progress | completed | cancelled
}
```

---

### `GET /api/production/equipment`
> Get all production equipment

**Auth required**

---

### `POST /api/production/equipment`
> Add new equipment

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Coffee Roaster",
  "type": "roaster",
  "serialNumber": "...",       // optional
  "purchaseDate": "...",       // optional
  "nextServiceDate": "..."     // optional
}
```

---

### `PUT /api/production/equipment/:id`
> Update equipment details

**Role: `ADMIN` | `MANAGER`**

```json
// All fields optional
{
  "name": "...",
  "status": "maintenance",     // active | maintenance | retired
  "nextServiceDate": "..."
}
```

---

### `POST /api/production/equipment/:id/service-log`
> Log a service entry for equipment

**Role: `ADMIN` | `MANAGER`**

```json
{
  "description": "Routine maintenance",
  "serviceDate": "2026-06-22",
  "technician": "...",         // optional
  "cost": 500,                 // optional
  "nextServiceDate": "..."     // optional
}
```

---

### `GET /api/production/equipment/:id/service-logs`
> Get all service logs for a piece of equipment

**Auth required**

---

---

# 25. Logistics — `/api/logistics`

---

### `GET /api/logistics/drivers`
> Get all delivery drivers

**Auth required**

```json
// Response
{
  "data": [
    { "_id": "...", "name": "...", "whatsappPhone": "...", "vehicleType": "motorcycle", "status": "active" }
  ]
}
```

---

### `POST /api/logistics/drivers`
> Create a new delivery driver

**Role: `ADMIN` | `MANAGER`**

```json
{
  "name": "Driver Name",
  "whatsappPhone": "01012345678",
  "vehicleType": "motorcycle",           // motorcycle | car | bicycle
  "zones": ["Zone A", "Zone B"],         // optional
  "status": "active"                     // active | offline
}
```

---

### `PUT /api/logistics/drivers/:id`
> Update a driver

**Role: `ADMIN` | `MANAGER`**

Same fields as POST — all optional + `"isActive": true`

---

### `DELETE /api/logistics/drivers/:id`
> Delete a driver

**Role: `ADMIN` | `MANAGER`**

---

### `POST /api/logistics/dispatch`
> Dispatch a driver for delivery

**Role: `ADMIN` | `MANAGER` | `CASHIER`**

```json
{
  "driverId": "abc123",
  "orderId": "xyz789",
  "zone": "Zone A"   // optional
}
```

---

### `POST /api/logistics/drivers/:id/complete`
> Mark a delivery as completed

**Role: `ADMIN` | `MANAGER`**

```json
{
  "orderId": "...",   // optional
  "notes": "..."      // optional
}
```

---

### `GET /api/logistics/zones/:zone/orders`
> Get all orders in a delivery zone

**Auth required**

```
URL Param: zone — e.g. /api/logistics/zones/zone-a/orders
```

---

---

# WebSocket — Real-time Events

**Connect:**
```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.patriacoffeebeans.com', {
  auth: { token: 'Bearer eyJ...' }
});
```

**Events:**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `kitchen:join` | Client → Server | `{}` | Join the kitchen room to receive live orders |
| `kitchen:new-order` | Server → Client | `{ order }` | Fired when a new order comes in |
| `kitchen:order-status-update` | Client → Server | `{ orderId, status, itemIndex? }` | Update order or item status from kitchen |

---

---

# Quick Reference

## All Endpoints Summary

| Module | Endpoints |
|--------|-----------|
| Auth | 6 |
| Users | 4 |
| Tables | 4 |
| Reservations | 4 |
| Orders | 5 |
| Products | 4 |
| Categories | 4 |
| Offers | 5 |
| Coupons | 4 |
| Customers | 4 |
| Subscriptions | 5 |
| Kitchen | 2 |
| POS Shifts | 4 |
| Financial | 3 |
| Reports | 5 |
| Locations | 5 |
| Suppliers | 4 |
| Inventory | 5 |
| Notifications | 2 |
| Reviews | 4 |
| Warehouses | 7 |
| Purchasing | 6 |
| Pricing | 8 |
| Production | 9 |
| Logistics | 7 |
| **Total** | **116** |

## HTTP Methods

| Method | Count | Usage |
|--------|-------|-------|
| GET | 43 | Fetch data |
| POST | 45 | Create / actions |
| PUT | 20 | Full update |
| PATCH | 2 | Partial update / toggle |
| DELETE | 6 | Delete |

## Public Endpoints (No Auth)

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register admin |
| `POST /api/auth/login` | Login |
| `POST /api/auth/refresh` | Refresh token |
| `POST /api/auth/forgot-password` | Reset password |
| `POST /api/reviews` | Submit a review |
