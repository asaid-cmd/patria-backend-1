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

    const pendingOrders = await Order.countDocuments({ status: 'ready', type: 'takeaway' });

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
    const { name, whatsappPhone, vehicleType, zones, status } = req.body;
    if (!name || !whatsappPhone) return sendError(res, 'Name and WhatsApp phone are required', 400);

    const driver = await Driver.create({
      name,
      whatsappPhone,
      vehicleType: vehicleType || 'motorcycle',
      zones: zones || [],
      status: status || 'active',
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
    if (driver.status !== 'active') return sendError(res, 'Driver is not available', 400);

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 'Order not found', 404);

    driver.status = 'busy';
    driver.currentOrderId = orderId;
    if (zone && !driver.zones.includes(zone)) driver.zones.push(zone);
    await driver.save();

    sendSuccess(res, { driver }, 'Driver dispatched successfully');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id);
    if (!driver) return sendError(res, 'Driver not found', 404);

    driver.status = 'active';
    driver.currentOrderId = null;
    await driver.save();

    sendSuccess(res, { driver }, 'Delivery completed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getZoneOrders = async (req, res) => {
  try {
    const { zone } = req.params;
    const { skip, limit, page } = getPaginationParams(req.query);

    const orders = await Order.find({ status: { $in: ['confirmed', 'preparing', 'ready'] }, type: 'takeaway' })
      .populate('staffId', 'name')
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'ready'] }, type: 'takeaway' });

    sendSuccess(res, paginatedResult(orders, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
