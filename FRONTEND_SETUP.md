# 🎯 إعداد الفرونت اند - Patria Restaurant

## تعليمات سريعة لمبرمج الفرونت اند

---

## 📦 الملفات المطلوبة

احتفظ بهذه الملفات وأرسلها لمبرمج الفرونت اند:

```
patria-backend/
├── postman_collection.json          ← استيرد هذا في Postman
├── API_INTEGRATION_GUIDE.md         ← اقرأ هذا أولاً
├── QUICK_START.md                   ← دليل البدء السريع
├── README.md                        ← التوثيق الكامل
└── FRONTEND_SETUP.md                ← هذا الملف
```

---

## 🚀 الخطوات الأولى (5 دقائق فقط!)

### 1. استيراد Postman Collection

```bash
1. افتح Postman
2. انقر: File → Import
3. اختر: postman_collection.json
4. اضغط: Import
```

**ماذا ستجد بعد الاستيراد؟**
- 🔐 18+ مجموعة من الـ endpoints
- 📝 50+ طلب مجهز للاستخدام
- 📊 أمثلة لجميع العمليات

### 2. أول طلب: Login

**اتبع هذه الخطوات:**

1. في Postman اختر: **🔐 Auth** → **Login**
2. استبدل `admin@patria.com` و `password123`
3. اضغط **Send**

**ستحصل على:**
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

4. انسخ القيمة الكاملة لـ `accessToken`
5. في Postman الأعلى: اذهب إلى **Variables**
6. الصق القيمة في `ACCESS_TOKEN`
7. الآن جميع الطلبات ستعمل! ✅

### 3. اختبر أول endpoint

جرب: **🍽️ Tables** → **Get All Tables**

إذا رأيت البيانات = ✅ **كل شيء يعمل!**

---

## 🔧 التكامل مع React

### خطوة 1: إنشاء API Service

```javascript
// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// إضافة Token تلقائياً
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### خطوة 2: استخدام في Component

```javascript
// src/hooks/useLogin.js
import api from '../services/api';

export const useLogin = () => {
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });
      
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      
      return response.data.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  return { login };
};
```

### خطوة 3: استخدم في صفحة Login

```javascript
// src/pages/Login.jsx
import { useState } from 'react';
import { useLogin } from '../hooks/useLogin';

export default function Login() {
  const [email, setEmail] = useState('admin@patria.com');
  const [password, setPassword] = useState('password123');
  const { login } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      console.log('تم تسجيل الدخول:', user);
      // انتقل لصفحة الداشبورد
    } catch (error) {
      console.error('خطأ:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button type="submit">دخول</button>
    </form>
  );
}
```

---

## 📡 أمثلة الـ API Calls الشائعة

### الحصول على الطلبات

```javascript
import api from '../services/api';

export const useOrders = () => {
  const getOrders = async () => {
    const response = await api.get('/orders?page=1&limit=10');
    return response.data.data;
  };

  const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data.data;
  };

  return { getOrders, createOrder };
};
```

### الحصول على المنتجات

```javascript
export const useProducts = () => {
  const getProducts = async (categoryId) => {
    const response = await api.get('/products', {
      params: { categoryId, page: 1, limit: 20 }
    });
    return response.data.data;
  };

  return { getProducts };
};
```

### الحصول على الجداول

```javascript
export const useTables = () => {
  const getTables = async () => {
    const response = await api.get('/tables');
    return response.data.data;
  };

  return { getTables };
};
```

---

## 📊 صيغة الاستجابات

جميع الاستجابات لديها نفس الصيغة:

### ✅ النجاح (Success)

```javascript
{
  statusCode: 200,
  success: true,
  message: "Success",
  data: {
    // البيانات هنا
  }
}
```

### ❌ الخطأ (Error)

```javascript
{
  statusCode: 400,
  success: false,
  message: "Validation error: email is required",
  data: null
}
```

---

## 🔐 معالجة التوكن

### تخزين بعد Login

```javascript
localStorage.setItem('accessToken', response.data.data.accessToken);
localStorage.setItem('refreshToken', response.data.data.refreshToken);
```

### استخدام في الطلبات

```javascript
const token = localStorage.getItem('accessToken');
headers: {
  'Authorization': `Bearer ${token}`
}
```

### مسح عند Logout

```javascript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

---

## 🌐 معلومات الاتصال

### المتغيرات المهمة

```javascript
// في ملف .env أو أي مكان آمن
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### رابط الـ Swagger (للاختبار)

```
http://localhost:5000/api-docs
```

### Health Check

```bash
curl http://localhost:5000/api/health
# الاستجابة: {"status":"ok","timestamp":"..."}
```

---

## 📚 الموارد المتاحة

| الملف | الاستخدام |
|------|---------|
| `postman_collection.json` | اختبر الـ endpoints |
| `API_INTEGRATION_GUIDE.md` | شرح تفصيلي للدمج |
| `README.md` | الوثائق الكاملة |
| `QUICK_START.md` | دليل البدء السريع |
| `/api-docs` | Swagger توثيق تفاعلي |

---

## ✅ قائمة التحقق

- [ ] تم تشغيل الخادم (`npm run dev`)
- [ ] تم استيراد Postman Collection
- [ ] نجح أول Login في Postman
- [ ] تم إنشاء API service في React
- [ ] تم اختبار أول endpoint من React
- [ ] تم حفظ التوكن في localStorage

---

## 🆘 حل المشاكل الشائعة

### المشكلة: "Cannot POST /api/auth/login"
```
السبب: الخادم لا يعمل
الحل: تأكد من تشغيل: npm run dev
```

### المشكلة: "401 Unauthorized"
```
السبب: Token غير صحيح أو منتهي
الحل: سجل الدخول مجدداً وحدّث التوكن
```

### المشكلة: "CORS error"
```
السبب: عدم تطابق الـ origin
الحل: تأكد أن CORS_ORIGIN يحتوي على رابط الفرونت اند
```

### المشكلة: "Network error"
```
السبب: الخادم لا يستجيب
الحل: اختبر http://localhost:5000/api/health
```

---

## 🚀 الخطوات التالية

1. **أنهِ صفحة تسجيل الدخول** ✅
2. **أضف صفحة الطلبات** 📋
3. **أضف صفحة المنتجات** 🏪
4. **أضف صفحة الجداول** 🍽️
5. **أضف WebSocket للمطبخ** 👨‍🍳

---

## 💡 نصائح مهمة

### استخدم axios interceptors

```javascript
// التعامل مع Token انتهاء الصلاحية تلقائياً
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      // حاول تحديث التوكن
      const newToken = await refreshAccessToken();
      // أعد محاولة الطلب
    }
    return Promise.reject(error);
  }
);
```

### استخدم error boundaries

```javascript
// التعامل مع الأخطاء بشكل آمن
try {
  const data = await api.get('/orders');
  setOrders(data.data.data);
} catch (error) {
  setError(error.response?.data?.message || 'حدث خطأ');
}
```

---

## 📞 تواصل

إذا واجهت أي مشاكل:
1. اقرأ `API_INTEGRATION_GUIDE.md`
2. اختبر في Postman أولاً
3. تحقق من `README.md` للتفاصيل الكاملة

---

**كل شيء جاهز للدمج! 🎉**

استمتع بالعمل! 🚀
