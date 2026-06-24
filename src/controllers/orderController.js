/**
 * Order Controller
 * Dashboard endpoints keep sendSuccess/sendError (dashboard frontend expects it).
 * Mobile endpoints return ERB-compatible flat JSON.
 */

const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Offer    = require('../models/Offer');
const { sendSuccess, sendError }               = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate }                 = require('../utils/validators');
const loyalty                                  = require('../utils/loyaltyConfig');
const { notifyUser }                           = require('../utils/notifyUser');

function getIo(req) { return req.app.get('io') || null; }

/* ══════════════════════════════════════════════════════════
   DASHBOARD ENDPOINTS  (keep sendSuccess wrapper)
══════════════════════════════════════════════════════════ */

exports.getOrders = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const orders = await Order.find()
      .populate('tableId staffId items.productId')
      .skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Order.countDocuments();
    sendSuccess(res, paginatedResult(orders, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { error, value } = validate(validators.createOrderSchema, req.body);
    if (error) return sendError(res, error.details.map(e => e.message).join(', '), 400);

    const { items, ...rest } = value;
    let subtotal = 0;
    items.forEach(item => { subtotal += item.price * item.quantity; });
    const tax   = subtotal * 0.14;
    const total = subtotal + tax;

    const order = await Order.create({ items, subtotal, tax, total, staffId: req.user.id, ...rest });
    const io = getIo(req);
    if (io) io.emit('newOrder', order);

    sendSuccess(res, { order: await order.populate('items.productId') }, 'Order created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const order      = await Order.findById(id);
    if (!order) return sendError(res, 'Order not found', 404);

    const prevStatus = order.status;
    order.status     = status;
    const updated    = await order.save();

    const io = getIo(req);
    if (io) {
      io.emit(`orderStatusUpdated_${order._id}`, updated);
      io.emit('orderStatusUpdated', updated);
    }

    if (prevStatus !== 'completed' && status === 'completed' && order.customerId) {
      _awardLoyalty(order.customerId, order).catch(() => {});
    }
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      _refundLoyalty(order).catch(() => {});
    }

    const notifMap = {
      confirmed: { type: 'order_confirmed', title: 'تم تأكيد طلبك ✅',     body: `طلبك رقم #${order._id.toString().slice(-6)} تم تأكيده` },
      preparing: { type: 'order_preparing', title: 'طلبك قيد التحضير 👨‍🍳', body: `طلبك رقم #${order._id.toString().slice(-6)} يُحضَّر الآن` },
      completed: { type: 'order_delivered', title: 'تم تسليم طلبك ☕',      body: `طلبك رقم #${order._id.toString().slice(-6)} وصل. استمتع!` },
      cancelled: { type: 'order_cancelled', title: 'تم إلغاء طلبك ❌',      body: `طلبك رقم #${order._id.toString().slice(-6)} تم إلغاؤه` },
    };
    const notif = notifMap[status];
    if (notif && order.customerId) {
      notifyUser({
        customerId: String(order.customerId),
        type:       notif.type,
        title:      notif.title,
        body:       notif.body,
        orderId:    String(order._id),
        data:       { screen: 'order_details', orderId: String(order._id) },
      }).catch(() => {});
    }

    sendSuccess(res, { order: updated });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId staffId assignedDriver')
      .populate('items.product',   'name price images')
      .populate('items.productId', 'name price images')
      .lean();
    if (!order) return sendError(res, 'Order not found', 404);
    // Mobile requests get ERB shape; dashboard requests get the raw order
    const isMobile = req.originalUrl.includes('/mobile/');
    res.json(isMobile ? _orderShape(order) : order);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Order deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ══════════════════════════════════════════════════════════
   MOBILE ENDPOINTS  (ERB flat JSON format)
══════════════════════════════════════════════════════════ */

exports.placeCustomerOrder = async (req, res) => {
  try {
    const {
      orderType, items, customer, summary,
      payment, notes, couponCode, pointsToRedeem,
    } = req.body;

    if (!items || !items.length) return res.status(400).json({ message: 'items مطلوبة' });

    const customerId = req.user.id;
    let subtotal     = summary?.subtotal || 0;
    let deliveryFee  = summary?.deliveryFee || 0;
    let discount     = 0;
    let pointsDiscountAmount    = 0;
    let effectivePointsRedeemed = 0;

    // 1. Coupon validation
    if (couponCode) {
      const now   = new Date();
      const offer = await Offer.findOne({
        $or: [{ code: couponCode }, { couponCode }],
        status: 'active',
        startDate: { $lte: now },
        endDate:   { $gte: now },
      });
      if (!offer) return res.status(400).json({ message: 'كود الخصم غير صالح أو منتهي الصلاحية' });

      const maxUses   = offer.maxUses || offer.usageLimit || 0;
      const usedCount = offer.usedCount || offer.usageCount || 0;
      if (maxUses > 0 && usedCount >= maxUses) {
        return res.status(400).json({ message: 'تم استنفاذ عدد مرات استخدام الكود' });
      }

      discount = offer.discountType === 'percentage'
        ? parseFloat(((offer.discountValue / 100) * subtotal).toFixed(2))
        : Math.min(offer.discountValue || 0, subtotal);

      Offer.findByIdAndUpdate(offer._id, { $inc: { usedCount: 1, usageCount: 1 } }).catch(() => {});
    }

    // 2. Loyalty redemption
    const cust = await Customer.findById(customerId).select('loyaltyPoints fcmTokens');
    if (!cust) return res.status(404).json({ message: 'العميل غير موجود' });

    const redeemPoints = parseInt(pointsToRedeem) || 0;
    if (redeemPoints > 0) {
      if (redeemPoints < loyalty.MIN_REDEEM_POINTS) {
        return res.status(400).json({ message: `الحد الأدنى للاسترداد ${loyalty.MIN_REDEEM_POINTS} نقطة` });
      }
      if (redeemPoints > (cust.loyaltyPoints || 0)) {
        return res.status(400).json({ message: 'رصيد النقاط غير كافٍ' });
      }
      const maxRedeem = loyalty.maxRedeemablePoints(cust.loyaltyPoints, subtotal - discount);
      effectivePointsRedeemed = Math.min(redeemPoints, maxRedeem);
      pointsDiscountAmount    = loyalty.redeemDiscountEgp(effectivePointsRedeemed);

      await Customer.findByIdAndUpdate(customerId, {
        $inc: { loyaltyPoints: -effectivePointsRedeemed },
      });
    }

    // 3. Final total
    const totalDiscount = discount + pointsDiscountAmount;
    const total = Math.max(0, subtotal - totalDiscount + deliveryFee);

    // 4. Save order
    const order = await Order.create({
      type:               orderType || 'Delivery',
      customerId,
      customer,
      items,
      subtotal,
      deliveryFee,
      discount:           totalDiscount,
      couponCode:         couponCode || null,
      pointsRedeemed:     effectivePointsRedeemed,
      pointsDiscountAmount,
      total,
      paymentMethod:      payment?.method || 'Cash',
      notes,
      status:             'pending',
    });

    // 5. Socket + FCM
    const io = getIo(req);
    if (io) io.emit('newOrder', order);

    notifyUser({
      customerId: String(customerId),
      type:       'order_placed',
      title:      'تم استلام طلبك 🛒',
      body:       'طلبك وصلنا وجاري المراجعة',
      orderId:    String(order._id),
      data:       { screen: 'order_details', orderId: String(order._id) },
    }).catch(() => {});

    // 6. Return ERB-format order
    const populated = await Order.findById(order._id)
      .populate('items.product', 'name price images')
      .populate('items.productId', 'name price images')
      .lean();
    const estimatedPoints = loyalty.computePointsEarned(total);
    res.status(201).json(_orderShape(populated, estimatedPoints));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ERB returns a direct ARRAY (not paginated object)
exports.getMyOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page  = parseInt(req.query.page)  || 1;
    const skip  = (page - 1) * limit;

    const orders = await Order.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product',   'name price images')
      .populate('items.productId', 'name price images')
      .lean();

    res.json(orders.map(o => _orderShape(o)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reorder = async (req, res) => {
  try {
    const original = await Order.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!original) return res.status(404).json({ message: 'الطلب غير موجود' });

    const newOrder = await Order.create({
      type: original.type, customerId: req.user.id,
      customer: original.customer, items: original.items,
      subtotal: original.subtotal, deliveryFee: original.deliveryFee,
      total: original.total, paymentMethod: original.paymentMethod,
      notes: original.notes, status: 'pending',
    });

    const io = getIo(req);
    if (io) io.emit('newOrder', newOrder);

    const populated = await Order.findById(newOrder._id)
      .populate('items.product', 'name price images').lean();
    res.status(201).json(_orderShape(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('assignedDriver', 'name phone vehicleType location');
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

    const driver = order.assignedDriver;
    res.json({
      orderId:        order.orderId || String(order._id),
      status:         order.status,
      orderType:      order.type,
      deliveryStatus: order.deliveryStatus,
      createdAt:      order.createdAt,
      customer: {
        name:    order.customer?.name,
        phone:   order.customer?.phone,
        address: order.customer?.address,
      },
      driver: driver ? {
        _id:               String(driver._id),
        name:              driver.name,
        phone:             driver.phone,
        lat:               driver.location?.lat,
        lng:               driver.location?.lng,
        locationUpdatedAt: driver.location?.updatedAt,
      } : null,
      summary: {
        subtotal:    order.subtotal,
        deliveryFee: order.deliveryFee,
        discount:    order.discount,
        total:       order.total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* Build ERB-compatible order shape — matches API_RESPONSES_EXAMPLES.json exactly */
function _orderShape(o, estimatedPointsEarned) {
  const items = (o.items || []).map(item => {
    const prod = item.product || item.productId;
    const img  = prod?.images?.[0] || item.image || null;
    const variantDisplay = (item.selectedVariants || [])
      .map(v => `${v.group}: ${v.option}`).join(', ');
    return {
      _id:              item._id,
      product:          prod ? { _id: prod._id, name: prod.name, price: prod.price, image: img } : null,
      name:             item.name || prod?.name,
      quantity:         item.quantity,
      price:            item.price,
      notes:            item.notes || '',
      selectedVariants: item.selectedVariants || [],
      selectedExtras:   item.selectedExtras   || [],
      variantDisplay,
    };
  });

  return {
    _id:           o._id,
    orderId:       o.orderId,
    createdAt:     o.createdAt,
    status:        o.status,
    deliveryStatus:o.deliveryStatus || null,
    type:          o.type,
    customer:      o.customer || null,
    items,
    summary: {
      subtotal:              o.subtotal    || 0,
      deliveryFee:           o.deliveryFee || 0,
      discount:              o.discount    || 0,
      total:                 o.total       || 0,
      estimatedPointsEarned: estimatedPointsEarned ?? (o.estimatedPointsEarned || 0),
    },
    totalPrice:            o.total       || 0,
    subtotal:              o.subtotal    || 0,
    deliveryFee:           o.deliveryFee || 0,
    discount:              o.discount    || 0,
    couponCode:            o.couponCode  || null,
    pointsRedeemed:        o.pointsRedeemed        || 0,
    pointsDiscountAmount:  o.pointsDiscountAmount   || 0,
    estimatedPointsEarned: estimatedPointsEarned ?? (o.estimatedPointsEarned || 0),
    paymentMethod:         o.paymentMethod || null,
    notes:                 o.notes        || null,
    isReviewed:            o.isReviewed   || false,
    rating:                o.rating       || null,
    reviewComment:         o.reviewComment || null,
    assignedDriver:        o.assignedDriver || null,
    updatedAt:             o.updatedAt,
  };
}

exports.saveCustomerLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat و lng مطلوبان' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, customerId: req.user.id },
      { customerLocation: { lat, lng } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

    const io = getIo(req);
    if (io) io.emit(`customerLocationUpdated_${order._id}`, { lat, lng });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════
   Internal helpers
══════════════════════════════════════════════════════════ */
async function _awardLoyalty(customerId, order) {
  const cust = await Customer.findById(customerId);
  if (!cust) return;
  const pts      = loyalty.computePointsEarned(order.total || 0);
  cust.loyaltyPoints = (cust.loyaltyPoints || 0) + pts;
  cust.tier          = loyalty.autoTier(cust.loyaltyPoints);
  await cust.save();
}

async function _refundLoyalty(order) {
  const refund = order.pointsRedeemed || 0;
  if (refund > 0 && order.customerId) {
    await Customer.findByIdAndUpdate(order.customerId, { $inc: { loyaltyPoints: refund } });
  }
}
