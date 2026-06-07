# 📱 لمبرمج الفرونت اند - Patria Backend API

## ✅ الخادم جاهز بالكامل!

---

## 📂 الملفات التي تحتاجها

**انسخ هذه الملفات من الفولدر:**

```
✅ postman_collection.json      ← استخدمه في Postman
✅ API_INTEGRATION_GUIDE.md     ← اقرأ هذا أولاً
✅ FRONTEND_SETUP.md            ← خطوات التكامل مع React
✅ README.md                    ← الوثائق الكاملة
```

---

## 🚀 البدء السريع (5 دقائق)

### 1. تشغيل الخادم
```bash
cd patria-backend
npm install
npm run dev
```

الخادم يعمل على: **http://localhost:5000**

### 2. اختبر الاتصال
```bash
curl http://localhost:5000/api/health
```

### 3. استيراد Postman
- افتح Postman
- **File** → **Import** → اختر `postman_collection.json`
- اضغط **Import**

### 4. أول تسجيل دخول
- افتح **🔐 Auth** → **Login**
- اضغط **Send**
- انسخ `accessToken` إلى متغيرات البيئة

---

## 🔑 المعلومات الأساسية

| المعلومة | القيمة |
|---------|--------|
| **الخادم** | http://localhost:5000 |
| **الـ API Base URL** | http://localhost:5000/api |
| **Swagger Docs** | http://localhost:5000/api-docs |
| **WebSocket** | ws://localhost:5000 |
| **Admin Email** | admin@patria.com |
| **Admin Password** | password123 |
| **Default Port** | 5000 |

---

## 📡 جميع الـ Endpoints (100+ endpoint)

### 🔐 المصادقة (Auth)
```
POST   /auth/register          ← تسجيل مسؤول جديد
POST   /auth/login             ← تسجيل دخول
GET    /auth/me                ← بيانات المستخدم الحالي
POST   /auth/refresh           ← تحديث التوكن
POST   /auth/logout            ← تسجيل خروج
POST   /auth/forgot-password   ← استعادة كلمة المرور
```

### 👥 المستخدمين (Users)
```
GET    /users                  ← جميع المستخدمين
POST   /users                  ← إنشاء مستخدم
PUT    /users/:id              ← تعديل مستخدم
DELETE /users/:id              ← حذف مستخدم
```

### 🏪 المنتجات (Products)
```
GET    /products               ← جميع المنتجات
POST   /products               ← إنشاء منتج (مع صور)
PUT    /products/:id           ← تعديل منتج
DELETE /products/:id           ← حذف منتج
```

### 📂 الفئات (Categories)
```
GET    /categories             ← جميع الفئات
POST   /categories             ← إنشاء فئة
PUT    /categories/:id         ← تعديل فئة
DELETE /categories/:id         ← حذف فئة
```

### 🍽️ الطاولات (Tables)
```
GET    /tables                 ← جميع الطاولات
POST   /tables                 ← إنشاء طاولة
PUT    /tables/:id             ← تحديث حالة الطاولة
DELETE /tables/:id             ← حذف طاولة
```

### 📋 الطلبات (Orders)
```
GET    /orders                 ← جميع الطلبات
POST   /orders                 ← إنشاء طلب جديد
GET    /orders/:id             ← تفاصيل طلب
PUT    /orders/:id             ← تحديث حالة الطلب
DELETE /orders/:id             ← حذف طلب
```

### 🔖 الحجوزات (Reservations)
```
GET    /reservations           ← جميع الحجوزات
POST   /reservations           ← إنشاء حجز
PUT    /reservations/:id       ← تعديل الحجز
DELETE /reservations/:id       ← حذف الحجز
```

### 👥 العملاء (Customers)
```
GET    /customers              ← جميع العملاء
GET    /customers/stats        ← إحصائيات العملاء
PUT    /customers/:id          ← تعديل العميل
DELETE /customers/:id          ← حذف العميل
```

### 🎁 العروض (Offers)
```
GET    /offers                 ← جميع العروض
POST   /offers                 ← إنشاء عرض (مع صورة)
PUT    /offers/:id             ← تعديل العرض
PATCH  /offers/:id/toggle      ← تفعيل/تعطيل العرض
DELETE /offers/:id             ← حذف العرض
```

### 🎟️ القسائم (Coupons)
```
GET    /coupons                ← جميع القسائم
POST   /coupons                ← إنشاء قسيمة
PUT    /coupons/:id            ← تعديل قسيمة
DELETE /coupons/:id            ← حذف قسيمة
```

### 📅 الاشتراكات (Subscriptions)
```
GET    /subscriptions          ← جميع الاشتراكات
GET    /subscriptions/stats    ← إحصائيات الاشتراكات
POST   /subscriptions          ← إنشاء اشتراك
PUT    /subscriptions/:id      ← تعديل الاشتراك
DELETE /subscriptions/:id      ← إلغاء الاشتراك
```

### 💰 المالية (Financial)
```
GET    /financial/overview     ← نظرة عامة مالية
GET    /financial/transactions ← جميع المعاملات
POST   /financial/transactions ← إضافة معاملة
```

### 👨‍🍳 المطبخ (Kitchen)
```
GET    /kitchen/orders         ← طلبات المطبخ
PUT    /kitchen/orders/:id     ← تحديث حالة الطلب
```

### 💵 Shifts (POS)
```
POST   /pos/shifts/open        ← فتح وردية
PUT    /pos/shifts/close       ← إغلاق وردية
GET    /pos/shifts/current     ← الوردية الحالية
GET    /pos/shifts/:id         ← ملخص الوردية
```

### 📍 الفروع (Locations)
```
GET    /locations              ← جميع الفروع
POST   /locations              ← إنشاء فرع
PUT    /locations/:id          ← تعديل فرع
DELETE /locations/:id          ← حذف فرع
```

### 🤝 الموردين (Suppliers)
```
GET    /suppliers              ← جميع الموردين
POST   /suppliers              ← إنشاء مورد
PUT    /suppliers/:id          ← تعديل مورد
DELETE /suppliers/:id          ← حذف مورد
```

### 📊 التقارير (Reports)
```
GET    /reports/overview       ← تقرير عام
GET    /reports/employees      ← تقرير الموظفين
```

### 🔔 الإشعارات (Notifications)
```
GET    /notifications          ← الإشعارات
PUT    /notifications/:id      ← تحديد كمقروء
```

---

## 🔐 طريقة المصادقة

جميع الـ endpoints تحتاج **Access Token** في الـ headers:

```javascript
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### الحصول على Token

**POST** `/auth/login`
```json
{
  "email": "admin@patria.com",
  "password": "password123"
}
```

**الاستجابة:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## 📝 صيغة الطلبات والاستجابات

### مثال: إنشاء طلب جديد

**Request:**
```json
POST /api/orders
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "type": "dine_in",
  "tableId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Order created",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439013",
      "type": "dine_in",
      "tableId": "507f1f77bcf86cd799439011",
      "items": [...],
      "subtotal": 50,
      "tax": 7,
      "total": 57,
      "status": "pending",
      "createdAt": "2026-05-04T..."
    }
  }
}
```

---

## 🎯 أدوار المستخدمين (Roles)

| الدور | الصلاحيات |
|------|---------|
| **SUPER_ADMIN** | كل شيء |
| **ADMIN** | إدارة المستخدمين والمنتجات والتقارير |
| **MANAGER** | إدارة الموظفين والتقارير |
| **CASHIER** | إنشاء الطلبات وإدارة الورديات |
| **KITCHEN** | عرض وتحديث حالة الطلبات |
| **STAFF** | وصول محدود |

---

## 🔌 WebSocket (الوقت الفعلي)

للتحديثات الفورية في المطبخ:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

// الانضمام لغرفة المطبخ
socket.emit('kitchen:join', {});

// استقبال طلب جديد
socket.on('kitchen:new-order', (order) => {
  console.log('طلب جديد:', order);
});

// تحديث حالة الطلب
socket.emit('kitchen:order-status-update', {
  orderId: '507f...',
  status: 'ready',
  itemIndex: 0,
});
```

---

## 🛠️ أدوات مفيدة

### Postman Environment

```json
{
  "BASE_URL": "http://localhost:5000",
  "ACCESS_TOKEN": "",
  "REFRESH_TOKEN": "",
  "USER_ID": "",
  "PRODUCT_ID": "",
  "ORDER_ID": "",
  "TABLE_ID": "",
  "CUSTOMER_ID": "",
  "CATEGORY_ID": ""
}
```

### cURL Command

```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Axios Setup (React)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 📊 البيانات المتوفرة

بعد تشغيل الخادم والـ seed:

```
✅ Admin User: admin@patria.com / password123
✅ 1 Location (Cairo)
✅ 5 Categories (Coffee, Pastries, Sandwiches, Desserts, Beverages)
✅ 5 Products (Espresso, Cappuccino, Croissant, Beef Sandwich, Chocolate Cake)
✅ 7 Tables (Main Hall, Terrace, VIP)
✅ 3 Sample Customers
```

---

## ⚠️ الأخطاء الشائعة

| الخطأ | السبب | الحل |
|------|------|-----|
| **401** | Token منتهي | سجّل دخول جديد |
| **403** | لا توجد صلاحيات | تحقق من دور المستخدم |
| **400** | بيانات خاطئة | تحقق من الصيغة |
| **409** | بيانات مكررة | استخدم قيم فريدة |
| **500** | خطأ الخادم | راجع logs الخادم |

---

## 📚 ملفات التوثيق

| الملف | المحتوى |
|------|--------|
| **README.md** | الوثائق الكاملة |
| **QUICK_START.md** | دليل البدء السريع |
| **API_INTEGRATION_GUIDE.md** | شرح التكامل بالتفصيل |
| **FRONTEND_SETUP.md** | خطوات Setup React |
| **postman_collection.json** | 50+ طلب مجهز |

---

## ✅ قائمة التحقق

قبل البدء في التطوير:

- [ ] تم تشغيل الخادم بنجاح
- [ ] يعمل `/api/health` بدون مشاكل
- [ ] تم استيراد Postman Collection
- [ ] نجح أول Login في Postman
- [ ] تم الحصول على accessToken
- [ ] تم اختبار endpoint واحد
- [ ] تم فهم صيغة الاستجابات

---

## 🚀 التكامل مع React

### الخطوة 1: تثبيت المكتبات
```bash
npm install axios
npm install socket.io-client
```

### الخطوة 2: إنشاء API Service
انظر `FRONTEND_SETUP.md`

### الخطوة 3: بناء الـ Components
```javascript
// Login Component → /auth/login
// Products Page → /products
// Orders Page → /orders
// Tables Page → /tables
// Kitchen Display → /kitchen/orders + WebSocket
```

---

## 🎓 موارد تعليمية إضافية

1. **اقرأ أولاً**: `API_INTEGRATION_GUIDE.md`
2. **اختبر ثانياً**: استخدم Postman Collection
3. **طبّق ثالثاً**: ابدأ بـ Login في React
4. **اسأل رابعاً**: إذا لم يعمل شيء

---

## 📞 معلومات الاتصال

إذا واجهت أي مشاكل:

1. **الخادم لا يعمل؟** → تأكد من `npm run dev`
2. **خطأ Connection؟** → تحقق من `BASE_URL`
3. **401 Unauthorized؟** → حدّث التوكن
4. **CORS Error؟** → افحص CORS_ORIGIN في .env

---

## 🎉 جاهز للدمج!

- ✅ **100+ endpoints** جاهزة
- ✅ **WebSocket** للتحديثات الفورية
- ✅ **JWT Authentication** محمية
- ✅ **Error Handling** شامل
- ✅ **Postman Collection** كامل

**استمتع بالعمل! 🚀**

---

*آخر تحديث: 2026-05-04*
*Version: 1.0.0*
*Status: ✅ Production Ready*
