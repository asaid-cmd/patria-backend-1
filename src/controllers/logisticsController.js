const Driver = require('../models/Driver');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ isActive: true }).populate('currentOrderId', 'type status');

    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    const offlineDrivers = drivers.filter(d => d.status === 'offline').length;
    const busyDrivers = drivers.filter(d => d.status === 'busy').length;

    const zones = [...new Set(drivers.flatMap(d => d.zones))];
    const driversByZone = zones.map(zone => ({
      zone,
      drivers: drivers.filter(d => d.zones.includes(zone)),
    }));

    const pendingOrders = await Order.countDocuments({ status: 'ready', type: { $in: ['takeaway', 'Delivery'] } });

    sendSuccess(res, {
      drivers,
      driversByZone,
      stats: { activeDrivers, offlineDrivers, busyDrivers, waitingOrders: pendingOrders },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, whatsappPhone, phone, password, vehicleType, zones, status } = req.body;
    if (!name) return sendError(res, 'Name is required', 400);
    if (!whatsappPhone && !phone) return sendError(res, 'whatsappPhone or phone is required', 400);

    const driver = await Driver.create({
      name,
      whatsappPhone,
      phone,
      password,
      vehicleType: vehicleType || 'motorcycle',
      zones: zones || [],
      status: status || 'offline',
    });

    sendSuccess(res, { driver }, 'Driver added', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!driver) return sendError(res, 'Driver not found', 404);
    sendSuccess(res, { driver });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    await Driver.findByIdAndUpdate(id, { isActive: false });
    sendSuccess(res, null, 'Driver removed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.dispatchDriver = async (req, res) => {
  try {
    const { driverId, orderId, zone } = req.body;
    if (!driverId || !orderId) return sendError(res, 'Driver and order are required', 400);

    const driver = await Driver.findById(driverId);
    if (!driver) return sendError(res, 'Driver not found', 404);
    if (driver.status === 'busy') return sendError(res, 'Driver is already on a delivery', 400);

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 'Order not found', 404);

    driver.status = 'busy';
    driver.currentOrderId = orderId;
    if (zone && !driver.zones.includes(zone)) driver.zones.push(zone);
    await driver.save();

    // Assign driver to order and set delivery tracking
    order.assignedDriver = driverId;
    order.deliveryStatus = 'Picking Up';
    if (order.status === 'ready') order.status = 'confirmed';
    await order.save();

    sendSuccess(res, { driver, order }, 'Driver dispatched successfully');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) return sendError(res, 'Driver not found', 404);

    if (orderId || driver.currentOrderId) {
      await Order.findByIdAndUpdate(
        orderId || driver.currentOrderId,
        { deliveryStatus: 'Delivered', status: 'completed' }
      );
    }

    driver.status = 'active';
    driver.currentOrderId = null;
    driver.shiftDeliveriesCount = (driver.shiftDeliveriesCount || 0) + 1;
    await driver.save();

    sendSuccess(res, { driver }, 'Delivery completed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.setDriverPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, phone } = req.body;
    if (!password) return sendError(res, 'password is required', 400);

    const driver = await Driver.findById(id);
    if (!driver) return sendError(res, 'Driver not found', 404);

    driver.password = password;
    if (phone) driver.phone = phone;
    await driver.save();

    sendSuccess(res, null, 'Driver credentials updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getZoneOrders = async (req, res) => {
  try {
    const { zone } = req.params;
    const { skip, limit, page } = getPaginationParams(req.query);

    const query = {
      status: { $in: ['confirmed', 'preparing', 'ready'] },
      type: { $in: ['takeaway', 'Delivery'] },
    };

    const orders = await Order.find(query)
      .populate('staffId', 'name')
      .populate('assignedDriver', 'name phone status')
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    sendSuccess(res, paginatedResult(orders, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
