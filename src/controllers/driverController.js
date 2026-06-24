/**
 * Driver Mobile Controller
 * Response format matches ERB exactly — flat JSON, no wrapper.
 * Device token field is `token` (not `fcmToken`) to match ERB.
 */

const jwt    = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Order  = require('../models/Order');
const DriverShift        = require('../models/DriverShift');
const DriverNotification = require('../models/DriverNotification');
const Customer           = require('../models/Customer');
const { notifyUser }     = require('../utils/notifyUser');
const loyalty            = require('../utils/loyaltyConfig');

const generateDriverToken = (driverId) =>
  jwt.sign(
    { id: driverId, role: 'driver' },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

function getIo(req) { return req.app.get('io') || null; }

/* ── Driver shape matching ERB ─────────────────────────────── */
function driverShape(d, extras = {}) {
  return {
    _id:               d._id,
    name:              d.name,
    phone:             d.phone,
    vehicleType:       d.vehicleType,
    status:            d.status,
    assignedZone:      d.assignedZone || null,
    performanceRating: d.performanceRating || 0,
    isOnShift:         d.isOnShift || false,
    shiftStartedAt:    d.shiftStartedAt || null,
    location:          d.location || null,
    ...extras,
  };
}

/* ══════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { phone, password, fcmToken, token: tokenField } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'رقم الهاتف وكلمة المرور مطلوبان' });

    const driver = await Driver.findOne({
      $or: [{ phone }, { whatsappPhone: phone }],
      isActive: true,
    });
    if (!driver) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    if (!driver.password) {
      return res.status(401).json({ message: 'لم يتم ضبط كلمة المرور. تواصل مع المسؤول.' });
    }

    const valid = await driver.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

    // Accept `token` OR `fcmToken` field (ERB uses `token`)
    const fcm = tokenField || fcmToken;
    if (fcm) {
      await Driver.findByIdAndUpdate(driver._id, { $addToSet: { fcmTokens: fcm } });
    }

    res.json({
      ...driverShape(driver),
      token: generateDriverToken(driver._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════ */
exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver) return res.status(404).json({ message: 'المندوب غير موجود' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDeliveries = await Order.countDocuments({
      assignedDriver: driver._id,
      deliveryStatus: 'Delivered',
      updatedAt: { $gte: today },
    });

    let shiftSeconds = 0;
    if (driver.isOnShift && driver.shiftStartedAt) {
      shiftSeconds = Math.floor((Date.now() - new Date(driver.shiftStartedAt).getTime()) / 1000);
    }

    res.json({
      ...driverShape(driver),
      shiftStats: {
        isOnShift:            driver.isOnShift,
        shiftStartedAt:       driver.shiftStartedAt,
        shiftSeconds,
        todayDeliveries,
        shiftDeliveriesCount: driver.shiftDeliveriesCount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.user.id, { name, phone }, { new: true, runValidators: true }
    );
    res.json(driverShape(driver));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await Driver.findByIdAndUpdate(req.user.id, { isActive: false });
    res.json({ message: 'تم حذف الحساب' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   SHIFT
══════════════════════════════════════════════════════════ */
exports.startShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver)          return res.status(404).json({ message: 'المندوب غير موجود' });
    if (driver.isOnShift) return res.status(400).json({ message: 'الشيفت مفتوح بالفعل' });

    const now = new Date();
    await Driver.findByIdAndUpdate(req.user.id, {
      isOnShift: true, shiftStartedAt: now, shiftDeliveriesCount: 0, status: 'active',
    });

    const shift = await DriverShift.create({
      driverId:  req.user.id,
      startedAt: now,
      hourlyRate: driver.hourlyRate || 0,
      status:    'active',
    });

    res.json(shift.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.endShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver)           return res.status(404).json({ message: 'المندوب غير موجود' });
    if (!driver.isOnShift) return res.status(400).json({ message: 'لا يوجد شيفت مفتوح' });

    const now         = new Date();
    const startedAt   = new Date(driver.shiftStartedAt);
    const hoursWorked = parseFloat(((now - startedAt) / 3600000).toFixed(2));
    const hourlyRate  = driver.hourlyRate || 0;
    const totalSalary = parseFloat((hoursWorked * hourlyRate).toFixed(2));

    await DriverShift.findOneAndUpdate(
      { driverId: req.user.id, status: 'active' },
      { endedAt: now, hoursWorked, ordersCompleted: driver.shiftDeliveriesCount || 0, totalSalary, status: 'completed' }
    );

    await Driver.findByIdAndUpdate(req.user.id, {
      isOnShift: false, shiftStartedAt: null, status: 'offline',
    });

    res.json({
      deliveriesCompleted: driver.shiftDeliveriesCount || 0,
      hoursWorked,
      totalSalary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestOvertime = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver)           return res.status(404).json({ message: 'المندوب غير موجود' });
    if (!driver.isOnShift) return res.status(400).json({ message: 'لا يوجد شيفت مفتوح' });

    await DriverShift.findOneAndUpdate(
      { driverId: req.user.id, status: 'active' },
      { overtimeRequested: true }
    );

    const io = getIo(req);
    if (io) io.emit('driver_overtime_request', { driverId: req.user.id, name: driver.name, phone: driver.phone });

    res.json({ message: 'تم إرسال طلب الوقت الإضافي' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════════════════ */
exports.getMyOrders = async (req, res) => {
  try {
    const since  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      assignedDriver: req.user.id,
      updatedAt: { $gte: since },
    }).sort({ createdAt: -1 });

    res.json({
      active:  orders.filter(o => !['Delivered', 'Failed'].includes(o.deliveryStatus)),
      history: orders.filter(o => ['Delivered', 'Failed'].includes(o.deliveryStatus)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orders = await Order.find({
      assignedDriver: req.user.id,
      createdAt: { $gte: today },
    }).sort({ createdAt: -1 });

    res.json({
      inProgress: orders.filter(o => !['Delivered', 'Failed'].includes(o.deliveryStatus)),
      delivered:  orders.filter(o => o.deliveryStatus === 'Delivered'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId }        = req.params;
    const { deliveryStatus } = req.body;

    const valid = ['Picking Up', 'Picked Up', 'Delivering', 'Near Customer', 'Delivered', 'Failed'];
    if (!valid.includes(deliveryStatus)) {
      return res.status(400).json({ message: `الحالة غير صحيحة. الحالات المتاحة: ${valid.join(', ')}` });
    }

    const order = await Order.findOne({ _id: orderId, assignedDriver: req.user.id });
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

    order.deliveryStatus = deliveryStatus;

    if (deliveryStatus === 'Delivered') {
      order.status = 'completed';
      await Driver.findByIdAndUpdate(req.user.id, { $inc: { shiftDeliveriesCount: 1 }, status: 'active' });
      await DriverShift.findOneAndUpdate(
        { driverId: req.user.id, status: 'active' },
        { $inc: { ordersCompleted: 1 } }
      );
      if (order.customerId) _awardLoyalty(order).catch(() => {});
    }

    await order.save();

    const io = getIo(req);
    if (io) {
      io.emit(`orderStatusUpdated_${order._id}`, order);
      io.emit('orderStatusUpdated', order);
    }

    const typeMap = {
      'Picking Up':    'delivery_picking',
      'Picked Up':     'delivery_picked',
      'Delivering':    'delivery_picking',
      'Near Customer': 'delivery_near',
      'Delivered':     'order_delivered',
      'Failed':        'delivery_failed',
    };
    const msgs = {
      'Picking Up':    { title: 'طلبك قيد الاستلام 🛵',    body: 'المندوب في طريقه لاستلام طلبك' },
      'Picked Up':     { title: 'طلبك في الطريق 🛵',        body: 'طلبك استُلم وهو في الطريق إليك' },
      'Delivering':    { title: 'طلبك في الطريق إليك 📍',   body: 'المندوب في طريقه لتوصيل طلبك' },
      'Near Customer': { title: 'المندوب قريب منك 📍',       body: 'طلبك سيصل خلال دقائق' },
      'Delivered':     { title: 'تم تسليم طلبك ☕',          body: 'طلبك وصل. استمتع!' },
      'Failed':        { title: 'تعذّر التسليم ⚠️',          body: 'تعذّر تسليم طلبك، سيتواصل معك فريقنا' },
    };
    const msg = msgs[deliveryStatus];
    if (msg && order.customerId) {
      notifyUser({
        customerId: String(order.customerId),
        type:       typeMap[deliveryStatus] || 'delivery_picking',
        title:      msg.title,
        body:       msg.body,
        orderId:    String(order._id),
        data:       { screen: 'order_tracking', orderId: String(order._id), deliveryStatus },
      }).catch(() => {});
    }

    res.json(order.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   LOCATION
══════════════════════════════════════════════════════════ */
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat و lng مطلوبان' });
    }

    await Driver.findByIdAndUpdate(req.user.id, {
      location: { lat, lng, accuracy, updatedAt: new Date() },
    });

    const activeOrder = await Order.findOneAndUpdate(
      {
        assignedDriver: req.user.id,
        deliveryStatus: { $in: ['Picking Up', 'Picked Up', 'Delivering', 'Near Customer'] },
      },
      { driverLocation: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );

    const io = getIo(req);
    if (io) {
      io.emit('driverLocationUpdated', { driverId: req.user.id, lat, lng });
      if (activeOrder) io.emit(`driverLocationUpdated_${activeOrder._id}`, { lat, lng });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   FCM TOKENS  (ERB field name: `token`, not `fcmToken`)
══════════════════════════════════════════════════════════ */
exports.registerFcmToken = async (req, res) => {
  try {
    const fcm = req.body.token || req.body.fcmToken;
    if (!fcm) return res.status(400).json({ message: 'token مطلوب' });
    await Driver.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: fcm } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unregisterFcmToken = async (req, res) => {
  try {
    const fcm = req.body.token || req.body.fcmToken;
    if (!fcm) return res.status(400).json({ message: 'token مطلوب' });
    await Driver.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: fcm } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════════════════ */
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page  = parseInt(req.query.page)  || 1;
    const skip  = (page - 1) * limit;

    const [notifications, unreadCount, total] = await Promise.all([
      DriverNotification.find({ driverId: req.user.id })
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      DriverNotification.countDocuments({ driverId: req.user.id, read: false }),
      DriverNotification.countDocuments({ driverId: req.user.id }),
    ]);

    res.json({ notifications, unreadCount, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await DriverNotification.updateMany({ driverId: req.user.id }, { read: true });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await DriverNotification.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'الإشعار غير موجود' });
    res.json({ ok: true, notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Internal helpers ─────────────────────────────────────── */
async function _awardLoyalty(order) {
  if (!order.customerId) return;
  const cust = await Customer.findById(order.customerId);
  if (!cust) return;
  const pts      = loyalty.computePointsEarned(order.total || 0);
  cust.loyaltyPoints = (cust.loyaltyPoints || 0) + pts;
  cust.tier          = loyalty.autoTier(cust.loyaltyPoints);
  await cust.save();
}
