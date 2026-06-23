const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Offer    = require('../models/Offer');
const { sendSuccess, sendError }                  = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult }    = require('../utils/pagination');
const { validators, validate }                    = require('../utils/validators');
const loyalty                                     = require('../utils/loyaltyConfig');
const { notifyUser }                              = require('../utils/notifyUser');

/* ── helpers ─────────────────────────────────────────────────────────── */
function getIo(req) {
  return req.app.get('io') || null;
}

/* ── Dashboard: list all orders ──────────────────────────────────────── */
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

/* ── Dashboard: create order (POS / staff) ───────────────────────────── */
exports.createOrder = async (req, res) => {
  try {
    const { error, value } = validate(validators.createOrderSchema, req.body);
    if (error) return sendError(res, error.details.map(e => e.message).join(', '), 400);

    const { items, ...rest } = value;
    let subtotal = 0;
    items.forEach(item => { subtotal += item.price * item.quantity; });
    const tax   = subtotal * 0.14;
    const total = subtotal + tax;

    const order = await Order.create({
      items,
      subtotal,
      tax,
      total,
      staffId: req.user.id,
      ...rest,
    });

    const io = getIo(req);
    if (io) io.emit('newOrder', order);

    sendSuccess(res, { order: await order.populate('items.productId') }, 'Order created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Dashboard: update order status ─────────────────────────────────── */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return sendError(res, 'Order not found', 404);

    const prevStatus = order.status;
    order.status     = status;
    const updated    = await order.save();

    const io = getIo(req);
    if (io) {
      io.emit(`orderStatusUpdated_${order._id}`, updated);
      io.emit('orderStatusUpdated', updated);
    }

    // Award loyalty on delivery
    if (prevStatus !== 'completed' && status === 'completed' && order.customerId) {
      _awardLoyalty(order.customerId, order).catch(() => {});
    }

    // Refund redeemed points on cancellation
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      _refundLoyalty(order).catch(() => {});
    }

    // Push notification to customer
    const notifMap = {
      confirmed:  { type: 'order_confirmed',  title: 'تم تأكيد طلبك ✅',       body: `طلبك رقم #${order._id.toString().slice(-6)} تم تأكيده` },
      preparing:  { type: 'order_preparing',  title: 'طلبك قيد التحضير 👨‍🍳',   body: `طلبك رقم #${order._id.toString().slice(-6)} يُحضَّر الآن` },
      completed:  { type: 'order_delivered',  title: 'تم تسليم طلبك ☕',        body: `طلبك رقم #${order._id.toString().slice(-6)} وصل. استمتع!` },
      cancelled:  { type: 'order_cancelled',  title: 'تم إلغاء طلبك ❌',        body: `طلبك رقم #${order._id.toString().slice(-6)} تم إلغاؤه` },
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

/* ── Dashboard: get single order ─────────────────────────────────────── */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId staffId items.productId assignedDriver');
    if (!order) return sendError(res, 'Order not found', 404);
    sendSuccess(res, { order });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Dashboard: delete order ─────────────────────────────────────────── */
exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Order deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Mobile: place customer order ────────────────────────────────────── */
exports.placeCustomerOrder = async (req, res) => {
  try {
    const {
      orderType, items, customer, summary,
      payment, notes, couponCode, pointsToRedeem,
    } = req.body;

    if (!items || !items.length) return sendError(res, 'items are required', 400);

    const customerId = req.user.id;
    let subtotal     = summary?.subtotal || 0;
    let deliveryFee  = summary?.deliveryFee || 0;
    let discount     = 0;
    let pointsDiscountAmount = 0;
    let effectivePointsRedeemed = 0;

    // ── 1. Coupon validation ──────────────────────────────────────────
    let appliedCoupon = null;
    if (couponCode) {
      const now   = new Date();
      const offer = await Offer.findOne({
        $or: [{ code: couponCode }, { couponCode }],
        status: 'active',
        startDate: { $lte: now },
        endDate:   { $gte: now },
      });

      if (!offer) return sendError(res, 'Invalid or expired coupon code', 400);

      const maxUses  = offer.maxUses || offer.usageLimit || 0;
      const usedCount = offer.usedCount || offer.usageCount || 0;
      if (maxUses > 0 && usedCount >= maxUses) {
        return sendError(res, 'Coupon usage limit reached', 400);
      }

      if (offer.discountType === 'percentage') {
        discount = parseFloat(((offer.discountValue / 100) * subtotal).toFixed(2));
      } else {
        discount = Math.min(offer.discountValue || 0, subtotal);
      }

      appliedCoupon = offer;
      // Increment usage count (non-blocking)
      Offer.findByIdAndUpdate(offer._id, { $inc: { usedCount: 1, usageCount: 1 } }).catch(() => {});
    }

    // ── 2. Loyalty points redemption ──────────────────────────────────
    const cust = await Customer.findById(customerId).select('loyaltyPoints fcmTokens');
    if (!cust) return sendError(res, 'Customer not found', 404);

    const redeemPoints = parseInt(pointsToRedeem) || 0;
    if (redeemPoints > 0) {
      if (redeemPoints < loyalty.MIN_REDEEM_POINTS) {
        return sendError(res, `Minimum ${loyalty.MIN_REDEEM_POINTS} points required to redeem`, 400);
      }
      if (redeemPoints > (cust.loyaltyPoints || 0)) {
        return sendError(res, 'Insufficient loyalty points', 400);
      }
      const maxRedeem = loyalty.maxRedeemablePoints(cust.loyaltyPoints, subtotal - discount);
      effectivePointsRedeemed   = Math.min(redeemPoints, maxRedeem);
      pointsDiscountAmount       = loyalty.redeemDiscountEgp(effectivePointsRedeemed);

      // Deduct points immediately
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { loyaltyPoints: -effectivePointsRedeemed },
      });
    }

    // ── 3. Final total ────────────────────────────────────────────────
    const totalDiscount = discount + pointsDiscountAmount;
    const total = Math.max(0, subtotal - totalDiscount + deliveryFee);

    // ── 4. Save order ─────────────────────────────────────────────────
    const order = await Order.create({
      type:          orderType || 'Delivery',
      customerId,
      customer,
      items,
      subtotal,
      deliveryFee,
      discount:      totalDiscount,
      couponCode:    couponCode || null,
      pointsRedeemed: effectivePointsRedeemed,
      pointsDiscountAmount,
      total,
      paymentMethod: payment?.method || 'Cash',
      notes,
      status: 'pending',
    });

    // ── 5. Socket broadcast ───────────────────────────────────────────
    const io = getIo(req);
    if (io) io.emit('newOrder', order);

    // ── 6. FCM push to customer ───────────────────────────────────────
    notifyUser({
      customerId: String(customerId),
      type:       'order_placed',
      title:      'تم استلام طلبك 🛒',
      body:       `طلبك وصلنا وجاري المراجعة`,
      orderId:    String(order._id),
      data:       { screen: 'order_details', orderId: String(order._id) },
    }).catch(() => {});

    // ── 7. Response with estimated points ─────────────────────────────
    const payload = order.toObject();
    payload.estimatedPointsEarned = loyalty.computePointsEarned(total);

    sendSuccess(res, { order: payload }, 'Order placed', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Mobile: my orders ───────────────────────────────────────────────── */
exports.getMyOrders = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const filter = { customerId: req.user.id };
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Order.countDocuments(filter);
    sendSuccess(res, paginatedResult(orders, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Mobile: reorder ─────────────────────────────────────────────────── */
exports.reorder = async (req, res) => {
  try {
    const original = await Order.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!original) return sendError(res, 'Order not found', 404);

    const newOrder = await Order.create({
      type:          original.type,
      customerId:    req.user.id,
      customer:      original.customer,
      items:         original.items,
      subtotal:      original.subtotal,
      deliveryFee:   original.deliveryFee,
      total:         original.total,
      paymentMethod: original.paymentMethod,
      notes:         original.notes,
      status:        'pending',
    });

    const io = getIo(req);
    if (io) io.emit('newOrder', newOrder);

    sendSuccess(res, { order: newOrder }, 'Reorder placed', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Mobile: live order tracking ─────────────────────────────────────── */
exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('assignedDriver', 'name phone vehicleType location')
      .select('status deliveryStatus driverLocation customerLocation assignedDriver customer createdAt summary');
    if (!order) return sendError(res, 'Order not found', 404);

    const driver = order.assignedDriver;
    sendSuccess(res, {
      tracking: {
        orderId:        String(order._id),
        status:         order.status,
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
        summary: order.summary,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Mobile: save customer GPS pin ───────────────────────────────────── */
exports.saveCustomerLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return sendError(res, 'lat and lng are required', 400);
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, customerId: req.user.id },
      { customerLocation: { lat, lng } },
      { new: true }
    );
    if (!order) return sendError(res, 'Order not found', 404);

    const io = getIo(req);
    if (io) io.emit(`customerLocationUpdated_${order._id}`, { lat, lng });

    sendSuccess(res, null, 'Customer location saved');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── Internal: award loyalty points when order delivered ─────────────── */
async function _awardLoyalty(customerId, order) {
  const cust = await Customer.findById(customerId);
  if (!cust) return;

  const pts = loyalty.computePointsEarned(order.total || 0);
  cust.loyaltyPoints = (cust.loyaltyPoints || 0) + pts;
  cust.tier          = loyalty.autoTier(cust.loyaltyPoints);
  await cust.save();
}

/* ── Internal: refund redeemed points on cancellation ───────────────── */
async function _refundLoyalty(order) {
  const refund = order.pointsRedeemed || 0;
  if (refund > 0 && order.customerId) {
    await Customer.findByIdAndUpdate(order.customerId, {
      $inc: { loyaltyPoints: refund },
    });
  }
}
