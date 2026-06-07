# 🚀 API Integration Guide - Patria Backend

## مرحباً بك! 👋

هذا الدليل يساعدك على دمج الـ API بسرعة في تطبيق الفرونت اند.

---

## 📋 المتطلبات الأساسية

- **Postman** أو أي REST Client
- **Node.js backend** يعمل على `http://localhost:5000`
- **React Frontend** لديك مستعد للدمج

---

## 🔧 خطوات البدء السريعة

### 1️⃣ استيراد الـ Collection في Postman

```
1. افتح Postman
2. انقر على "Import" → اختر "postman_collection.json"
3. اختر المجلد الحالي من patria-backend
4. انقر "Import"
```

### 2️⃣ تعيين متغيرات البيئة

افتح **Postman Environment Variables** وأضف:

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
  "CATEGORY_ID": "",
  "LOCATION_ID": "",
  "SHIFT_ID": "",
  "SUBSCRIPTION_ID": "",
  "OFFER_ID": "",
  "COUPON_ID": "",
  "SUPPLIER_ID": "",
  "NOTIFICATION_ID": ""
}
```

### 3️⃣ اختبر الاتصال

```bash
# هل الخادم يعمل؟
curl http://localhost:5000/api/health

# الاستجابة المتوقعة:
# {"status":"ok","timestamp":"2026-05-04T..."}
```

---

## 🔐 عملية المصادقة (Authentication)

### الخطوة 1: التسجيل (اختياري - للمرة الأولى فقط)

**POST** `/api/auth/register`

```json
{
  "name": "Admin User",
  "email": "admin@patria.com",
  "password": "password123"
}
```

**الاستجابة:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@patria.com",
      "role": "superadmin"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### الخطوة 2: تسجيل الدخول

**POST** `/api/auth/login`

```json
{
  "email": "admin@patria.com",
  "password": "password123"
}
```

**احفظ الـ tokens:**
```javascript
// في localStorage
localStorage.setItem('accessToken', response.data.accessToken);
localStorage.setItem('refreshToken', response.data.refreshToken);
```

### الخطوة 3: استخدام الـ Token في الطلبات

```javascript
// في رؤوس الطلب (Headers)
{
  "Authorization": "Bearer {{ACCESS_TOKEN}}"
}
```

### الخطوة 4: تحديث الـ Token عند انتهاء الصلاحية

**POST** `/api/auth/refresh`

```json
{
  "refreshToken": "{{REFRESH_TOKEN}}"
}
```

---

## 📡 أمثلة التكامل مع React

### 1️⃣ إعداد Axios

```javascript
// utils/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});

// إضافة Token للطلبات
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة انتهاء صلاحية Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem('accessToken', response.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return api(originalRequest);
      } catch {
        // إعادة التوجيه لصفحة تسجيل الدخول
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2️⃣ مثال على استخدام الـ API

```javascript
// useAuth.js
import api from './api';

export const useAuth = () => {
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  };

  return { login, logout, getCurrentUser };
};
```

### 3️⃣ الحصول على الطلبات (Orders)

```javascript
// hooks/useOrders.js
import api from './api';

export const useOrders = () => {
  const getOrders = async (page = 1, limit = 10) => {
    const response = await api.get('/orders', {
      params: { page, limit },
    });
    return response.data.data;
  };

  const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data.data;
  };

  const updateOrderStatus = async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}`, { status });
    return response.data.data;
  };

  return { getOrders, createOrder, updateOrderStatus };
};
```

### 4️⃣ رفع الصور (Upload)

```javascript
// hooks/useUpload.js
import api from './api';

export const useUpload = () => {
  const uploadProductImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file);
    
    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  };

  return { uploadProductImage };
};
```

---

## 📊 استجابات الـ API

### استجابة ناجحة (Success)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": {
    "orders": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### استجابة خطأ (Error)

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation error: price is required, categoryId is required",
  "data": null
}
```

---

## 🔄 WebSocket للتحديثات الفورية

### الاتصال بـ Kitchen Real-time

```javascript
// socket.js
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

// الانضمام لغرفة الطبخ
socket.emit('kitchen:join', {});

// استقبال طلبات جديدة
socket.on('kitchen:new-order', (order) => {
  console.log('طلب جديد:', order);
});

// استقبال تحديثات حالة الطلب
socket.on('kitchen:order-updated', (data) => {
  console.log('تم تحديث الطلب:', data);
});

// تحديث حالة الطلب
socket.emit('kitchen:order-status-update', {
  orderId: '507f1f77bcf86cd799439011',
  status: 'ready',
  itemIndex: 0,
});

export default socket;
```

---

## 🛠️ أدوات مفيدة

### 1. Postman Collections
- ملف `postman_collection.json` متوفر
- يحتوي على جميع الـ endpoints

### 2. Swagger Documentation
```
http://localhost:5000/api-docs
```
وثائق تفاعلية للـ API

### 3. Health Check
```bash
curl http://localhost:5000/api/health
```

---

## 📱 جدول الـ Endpoints الرئيسية

| المودول | الطريقة | الـ Endpoint | الوصف |
|---------|--------|-----------|-------|
| **Auth** | POST | `/auth/login` | تسجيل الدخول |
| **Auth** | GET | `/auth/me` | الحصول على المستخدم الحالي |
| **Products** | GET | `/products` | الحصول على المنتجات |
| **Products** | POST | `/products` | إنشاء منتج |
| **Orders** | GET | `/orders` | الحصول على الطلبات |
| **Orders** | POST | `/orders` | إنشاء طلب |
| **Tables** | GET | `/tables` | الحصول على الطاولات |
| **Customers** | GET | `/customers` | الحصول على العملاء |
| **Kitchen** | GET | `/kitchen/orders` | الحصول على طلبات المطبخ |
| **Financial** | GET | `/financial/overview` | نظرة عامة مالية |

---

## ⚠️ معالجة الأخطاء الشائعة

### خطأ 401 - غير مصرح (Unauthorized)
```
السبب: الـ token غير صحيح أو انتهت صلاحيته
الحل: قم بتحديث الـ token أو أعد تسجيل الدخول
```

### خطأ 403 - ممنوع (Forbidden)
```
السبب: ليس لديك صلاحيات كافية
الحل: تحقق من دور المستخدم (role)
```

### خطأ 400 - طلب خاطئ (Bad Request)
```
السبب: البيانات المرسلة غير صحيحة
الحل: تحقق من صيغة البيانات والحقول المطلوبة
```

### خطأ 409 - تضارب (Conflict)
```
السبب: يوجد سجل مكرر (مثل email موجود)
الحل: استخدم بيانات فريدة
```

---

## 🔐 أفضل الممارسات الأمنية

1. **حفظ الـ Tokens بأمان**
   ```javascript
   // استخدم httpOnly cookies بدلاً من localStorage (إن أمكن)
   localStorage.setItem('accessToken', token); // للتطوير فقط
   ```

2. **لا تشارك الـ Tokens**
   - لا تضع الـ tokens في الـ console
   - لا تشاركها عبر الإنترنت

3. **تعيين CORS بشكل صحيح**
   ```
   CORS_ORIGIN=http://localhost:3000
   ```

4. **استخدام HTTPS في الإنتاج**
   ```
   NODE_ENV=production
   ```

---

## 🚀 نصائح للأداء

1. **استخدم الـ Pagination**
   ```javascript
   // بدلاً من جلب جميع البيانات
   const response = await api.get('/orders?page=1&limit=20');
   ```

2. **Cache البيانات**
   ```javascript
   // استخدم useMemo أو Redux لتخزين البيانات مؤقتاً
   ```

3. **تقليل عدد الطلبات**
   ```javascript
   // اجمع عدة طلبات في طلب واحد إن أمكن
   ```

---

## 📞 دعم التطوير

### الملفات المرفقة:
- ✅ `postman_collection.json` - كولكشن API كامل
- ✅ `README.md` - وثائق المشروع
- ✅ `QUICK_START.md` - دليل البدء السريع
- ✅ `API_INTEGRATION_GUIDE.md` - هذا الملف

### للمزيد من المعلومات:
- 📖 اقرأ `README.md` في المشروع
- 🔗 اذهب لـ `/api-docs` عند تشغيل الخادم
- 💬 تواصل معنا عند الحاجة

---

## ✅ قائمة التحقق قبل الإنتاج

- [ ] تم اختبار جميع الـ endpoints
- [ ] تم تفعيل HTTPS
- [ ] تم تعيين متغيرات البيئة الصحيحة
- [ ] تم حفظ الـ tokens بأمان
- [ ] تم تفعيل CORS بشكل صحيح
- [ ] تم اختبار معالجة الأخطاء
- [ ] تم اختبار انتهاء صلاحية الـ token

---

**جاهز للدمج! 🎉**

نتمنى لك أسهل عملية دمج! 🚀
