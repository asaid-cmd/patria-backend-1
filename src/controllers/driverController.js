const jwt    = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Order  = require('../models/Order');
const DriverShift        = require('../models/DriverShift');
const DriverNotification = require('../models/DriverNotification');
const Customer           = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { notifyUser }             = require('../utils/notifyUser');
const { notifyDriver }           = require('../utils/notifyDriver');
const loyalty                    = require('../utils/loyaltyConfig');

const generateDriverToken = (driverId) =>
  jwt.sign({ id: driverId, role: 'driver' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '24h' });

function getIo(req) { return req.app.get('io') || null; }

/* ══════════════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { phone, password, fcmToken } = req.body;
    if (!phone || !password) return sendError(res, 'phone and password are required', 400);

    const driver = await Driver.findOne({ $or: [{ phone }, { whatsappPhone: phone }], isActive: true });
    if (!driver) return sendError(res, 'Invalid credentials', 401);
    if (!driver.password) {
      return sendError(res, 'Account not set up for mobile login. Contact admin to set password.', 401);
    }

    const valid = await driver.comparePassword(password);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    // Register FCM token on login
    if (fcmToken) {
      await Driver.findByIdAndUpdate(driver._id, { $addToSet: { fcmTokens: fcmToken } });
    }

    const token = generateDriverToken(driver._id);
    sendSuccess(res, { driver: driver.toJSON(), token }, 'Login successful');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════════════ */
exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver) return sendError(res, 'Driver not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDeliveries = await Order.countDocuments({
      assignedDriver: driver._id,
      deliveryStatus: 'Delivered',
      updatedAt: { $gte: today },
    });

    // Shift elapsed seconds
    let shiftSeconds = 0;
    if (driver.isOnShift && driver.shiftStartedAt) {
      shiftSeconds = Math.floor((Date.now() - new Date(driver.shiftStartedAt).getTime()) / 1000);
    }

    sendSuccess(res, {
      driver: driver.toJSON(),
      shiftStats: {
        isOnShift:            driver.isOnShift,
        shiftStartedAt:       driver.shiftStartedAt,
        shiftSeconds,
        todayDeliveries,
        shiftDeliveriesCount: driver.shiftDeliveriesCount,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.user.id, { name, phone }, { new: true, runValidators: true }
    );
    sendSuccess(res, { driver: driver.toJSON() }, 'Profile updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await Driver.findByIdAndUpdate(req.user.id, { isActive: false });
    sendSuccess(res, null, 'Account deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   SHIFT
══════════════════════════════════════════════════════════════════════ */
exports.startShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver)        return sendError(res, 'Driver not found', 404);
    if (driver.isOnShift) return sendError(res, 'Shift already started', 400);

    const now = new Date();

    await Driver.findByIdAndUpdate(req.user.id, {
      isOnShift: true,
      shiftStartedAt: now,
      shiftDeliveriesCount: 0,
      status: 'active',
    });

    // Create DriverShift record
    const shift = await DriverShift.create({
      driverId:   req.user.id,
      startedAt:  now,
      hourlyRate: driver.hourlyRate || 0,
      status:     'active',
    });

    sendSuccess(res, { shift }, 'Shift started');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.endShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver)          return sendError(res, 'Driver not found', 404);
    if (!driver.isOnShift) return sendError(res, 'No active shift', 400);

    const now        = new Date();
    const startedAt  = new Date(driver.shiftStartedAt);
    const hoursWorked = parseFloat(((now - startedAt) / 3600000).toFixed(2));
    const hourlyRate  = driver.hourlyRate || 0;
    const totalSalary = parseFloat((hoursWorked * hourlyRate).toFixed(2));

    // Close the open DriverShift record
    await DriverShift.findOneAndUpdate(
      { driverId: req.user.id, status: 'active' },
      {
        endedAt:         now,
        hoursWorked,
        ordersCompleted: driver.shiftDeliveriesCount,
        totalSalary,
        status:          'completed',
      }
    );

    await Driver.findByIdAndUpdate(req.user.id, {
      isOnShift:      false,
      shiftStartedAt: null,
      status:         'offline',
    });

    sendSuccess(res, {
      deliveriesCompleted: driver.shiftDeliveriesCount,
      hoursWorked,
      totalSalary,
    }, 'Shift ended');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.requestOvertime = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver)          return sendError(res, 'Driver not found', 404);
    if (!driver.isOnShift) return sendError(res, 'No active shift', 400);

    // Mark overtime request on active DriverShift
    await DriverShift.findOneAndUpdate(
      { driverId: req.user.id, status: 'active' },
      { overtimeRequested: true }
    );

    // Notify manager via socket
    const io = getIo(req);
    if (io) {
      io.emit('driver_overtime_request', {
        driverId: req.user.id,
        name:     driver.name,
        phone:    driver.phone,
      });
    }

    sendSuccess(res, null, 'Overtime request submitted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════════════════════════════ */
exports.getMyOrders = async (req, res) => {
  try {
    const since  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      assignedDriver: req.user.id,
      updatedAt: { $gte: since },
    }).sort({ createdAt: -1 });

    const active  = orders.filter(o => !['Delivered', 'Failed'].includes(o.deliveryStatus));
    const history = orders.filter(o => ['Delivered', 'Failed'].includes(o.deliveryStatus));

    sendSuccess(res, { active, history });
  } catch (error) {
    sendError(res, error.message, 500, error);
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

    sendSuccess(res, {
      inProgress: orders.filter(o => !['Delivered', 'Failed'].includes(o.deliveryStatus)),
      delivered:  orders.filter(o => o.deliveryStatus === 'Delivered'),
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId }       = req.params;
    const { deliveryStatus } = req.body;

    const valid = ['Picking Up', 'Picked Up', 'Delivering', 'Near Customer', 'Delivered', 'Failed'];
    if (!valid.includes(deliveryStatus)) {
      return sendError(res, `Invalid status. Valid: ${valid.join(', ')}`, 400);
    }

    const order = await Order.findOne({ _id: orderId, assignedDriver: req.user.id });
    if (!order) return sendError(res, 'Order not found', 404);

    order.deliveryStatus = deliveryStatus;

    if (deliveryStatus === 'Delivered') {
      order.status = 'completed';
      await Driver.findByIdAndUpdate(req.user.id, {
        $inc: { shiftDeliveriesCount: 1 },
        status: 'active',
      });
      // Update DriverShift ordersCompleted
      await DriverShift.findOneAndUpdate(
        { driverId: req.user.id, status: 'active' },
        { $inc: { ordersCompleted: 1 } }
      );
      // Award loyalty points to customer
      if (order.customerId) {
        _awardLoyalty(order).catch(() => {});
      }
    }

    await order.save();

    // ── Socket broadcast ─────────────────────────────────────────────
    const io = getIo(req);
    if (io) {
      io.emit(`orderStatusUpdated_${order._id}`, order);
      io.emit('orderStatusUpdated', order);
    }

    // ── Push notification to customer ────────────────────────────────
    const typeMap = {
      'Picking Up':    'delivery_picking',
      'Picked Up':     'delivery_picked',
      'Delivering':    'delivery_picking',
      'Near Customer': 'delivery_near',
      'Delivered':     'order_delivered',
      'Failed':        'delivery_failed',
    };
    const msgs = {
      'Picking Up':    { title: 'طلبك قيد الاستلام 🛵',     body: `المندوب في طريقه لاستلام طلبك` },
      'Picked Up':     { title: 'طلبك في الطريق 🛵',         body: `طلبك استُلم وهو في الطريق إليك` },
      'Delivering':    { title: 'طلبك في الطريق إليك 📍',    body: `المندوب في طريقه لتوصيل طلبك` },
      'Near Customer': { title: 'المندوب قريب منك 📍',        body: `طلبك سيصل خلال دقائق` },
      'Delivered':     { title: 'تم تسليم طلبك ☕',           body: `طلبك وصل. استمتع!` },
      'Failed':        { title: 'تعذّر التسليم ⚠️',           body: `تعذّر تسليم طلبك، سيتواصل معك فريقنا` },
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

    sendSuccess(res, { order }, 'Order status updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   LOCATION
══════════════════════════════════════════════════════════════════════ */
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    if (lat === undefined || lng === undefined) {
      return sendError(res, 'lat and lng are required', 400);
    }

    await Driver.findByIdAndUpdate(req.user.id, {
      location: { lat, lng, accuracy, updatedAt: new Date() },
    });

    // Update active order's driverLocation
    const activeOrder = await Order.findOneAndUpdate(
      {
        assignedDriver: req.user.id,
        deliveryStatus: { $in: ['Picking Up', 'Picked Up', 'Delivering', 'Near Customer'] },
      },
      { driverLocation: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );

    // Broadcast live location to dashboard + customer tracking screen
    const io = getIo(req);
    if (io) {
      io.emit('driverLocationUpdated', { driverId: req.user.id, lat, lng });
      if (activeOrder) {
        io.emit(`driverLocationUpdated_${activeOrder._id}`, { lat, lng });
      }
    }

    sendSuccess(res, null, 'Location updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   FCM TOKENS
══════════════════════════════════════════════════════════════════════ */
exports.registerFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return sendError(res, 'fcmToken is required', 400);
    await Driver.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: fcmToken } });
    sendSuccess(res, null, 'FCM token registered');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.unregisterFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return sendError(res, 'fcmToken is required', 400);
    await Driver.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: fcmToken } });
    sendSuccess(res, null, 'FCM token removed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   NOTIFICATIONS  (separate collection — not embedded)
══════════════════════════════════════════════════════════════════════ */
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page  = parseInt(req.query.page)  || 1;
    const skip  = (page - 1) * limit;

    const [notifications, unreadCount, total] = await Promise.all([
      DriverNotification.find({ driverId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DriverNotification.countDocuments({ driverId: req.user.id, read: false }),
      DriverNotification.countDocuments({ driverId: req.user.id }),
    ]);

    sendSuccess(res, { notifications, unreadCount, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await DriverNotification.updateMany({ driverId: req.user.id }, { read: true });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await DriverNotification.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user.id },
      { read: true }
    );
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Internal helpers
══════════════════════════════════════════════════════════════════════ */
async function _awardLoyalty(order) {
  if (!order.customerId) return;
  const cust = await Customer.findById(order.customerId);
  if (!cust) return;
  const pts = loyalty.computePointsEarned(order.total || 0);
  cust.loyaltyPoints = (cust.loyaltyPoints || 0) + pts;
  cust.tier          = loyalty.autoTier(cust.loyaltyPoints);
  await cust.save();
}
