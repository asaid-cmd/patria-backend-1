const Order = require('../models/Order');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Shift = require('../models/Shift');
const Location = require('../models/Location');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const buildDateFilter = (from, to) => {
  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) filter.$lte = new Date(to);
  return Object.keys(filter).length ? filter : null;
};

exports.getOverviewReport = async (req, res) => {
  try {
    const { from, to, source, shiftId, branchId } = req.query;
    const dateFilter = buildDateFilter(from, to);

    const orderFilter = {};
    if (dateFilter) orderFilter.createdAt = dateFilter;
    if (shiftId) orderFilter.shiftId = shiftId;
    if (branchId) orderFilter.locationId = branchId;

    const orders = await Order.find(orderFilter)
      .populate('items.productId', 'name price roastLevel grindType')
      .populate('staffId', 'name role');

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDiscounts = orders.filter(o => o.discountAmount > 0).length;
    const totalItemsOrdered = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0);

    // Daily revenue (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Order.aggregate([
      { $match: { ...orderFilter, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const productSales = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const pid = item.productId?._id?.toString() || item.productId?.toString();
        if (!pid) return;
        if (!productSales[pid]) {
          productSales[pid] = { name: item.productId?.name || 'Unknown', quantity: 0, revenue: 0 };
        }
        productSales[pid].quantity += item.quantity || 0;
        productSales[pid].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Sales by payment method
    const paymentBreakdown = {};
    orders.forEach(o => {
      const method = o.paymentMethod || 'unknown';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (o.total || 0);
    });

    // Sales by type
    const typeBreakdown = {};
    orders.forEach(o => {
      const type = o.type || 'unknown';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + (o.total || 0);
    });

    // Coupon performance
    const couponOrders = orders.filter(o => o.couponId);
    const couponRevenue = couponOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const couponDiscount = couponOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

    // Delivery performance (by location)
    const deliveryPerformance = await Order.aggregate([
      { $match: { ...orderFilter, type: 'takeaway' } },
      {
        $group: {
          _id: '$locationId',
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
    ]);

    // EOD Sessions (shifts)
    const shiftFilter = {};
    if (dateFilter) shiftFilter.createdAt = dateFilter;
    const shifts = await Shift.find(shiftFilter)
      .populate('cashierId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Roast level distribution
    const roastDist = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const rl = item.productId?.roastLevel;
        if (rl) roastDist[rl] = (roastDist[rl] || 0) + (item.quantity || 0);
      });
    });

    // Grind type distribution
    const grindDist = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const gt = item.productId?.grindType;
        if (gt) grindDist[gt] = (grindDist[gt] || 0) + (item.quantity || 0);
      });
    });

    const totalTax = orders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const totalServiceValue = 0;
    const totalDelivery = orders.filter(o => o.type === 'takeaway').reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const totalDiscountValue = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

    sendSuccess(res, {
      summary: { totalOrders, totalRevenue, totalDiscounts, totalItemsOrdered, totalTax, totalServiceValue, totalDelivery, totalDiscountValue },
      dailyRevenue,
      topProducts,
      paymentBreakdown,
      typeBreakdown,
      couponPerformance: { ordersWithCoupon: couponOrders.length, couponRevenue, couponDiscount },
      deliveryPerformance,
      eodSessions: shifts,
      roastDistribution: roastDist,
      grindDistribution: grindDist,
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getEmployeeReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = buildDateFilter(from, to);

    const orderFilter = {};
    if (dateFilter) orderFilter.createdAt = dateFilter;

    const employees = await User.find({ isActive: true }).select('-password');
    const totalEmployees = employees.length;

    const employeeStats = await Promise.all(employees.map(async emp => {
      const empOrders = await Order.find({ ...orderFilter, staffId: emp._id });
      const totalOrders = empOrders.length;
      const revenue = empOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

      const productCount = {};
      empOrders.forEach(o => {
        (o.items || []).forEach(item => {
          const pid = item.productId?.toString();
          if (pid) productCount[pid] = (productCount[pid] || 0) + (item.quantity || 0);
        });
      });
      const topProductId = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      let topProduct = null;
      if (topProductId) {
        topProduct = await Product.findById(topProductId).select('name');
      }

      const shifts = await Shift.find({ cashierId: emp._id, ...orderFilter });
      const totalWorkHours = shifts.reduce((sum, s) => {
        if (s.openedAt && s.closedAt) {
          return sum + (s.closedAt - s.openedAt) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);

      const revenuePercent = 0;

      return {
        employee: emp,
        totalOrders,
        cashierOrders: empOrders.filter(o => o.paymentMethod === 'cash').length,
        appOrders: empOrders.filter(o => o.type === 'takeaway').length,
        revenue,
        avgOrder: Math.round(avgOrder * 100) / 100,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        topProduct,
        revenuePercent,
        shifts,
      };
    }));

    const totalOrders = await Order.countDocuments(orderFilter);
    const totalRevenue = await Order.aggregate([
      { $match: orderFilter },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    sendSuccess(res, {
      employees: employeeStats,
      summary: {
        totalEmployees,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getBranchReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = buildDateFilter(from, to);

    const orderFilter = {};
    if (dateFilter) orderFilter.createdAt = dateFilter;

    const branchStats = await Order.aggregate([
      { $match: orderFilter },
      {
        $group: {
          _id: '$locationId',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrder: { $avg: '$total' },
          cashierOrders: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 1, 0] } },
          appOrders: { $sum: { $cond: [{ $eq: ['$type', 'takeaway'] }, 1, 0] } },
        },
      },
    ]);

    const locations = await Location.find();
    const locationMap = {};
    locations.forEach(l => { locationMap[l._id.toString()] = l.name; });

    const totalRevenue = branchStats.reduce((sum, b) => sum + b.totalRevenue, 0);
    const highestRegion = branchStats.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

    const enriched = branchStats.map(b => ({
      ...b,
      locationName: locationMap[b._id?.toString()] || 'Unknown',
      revenuePercent: totalRevenue > 0 ? Math.round((b.totalRevenue / totalRevenue) * 1000) / 10 : 0,
    }));

    const revenueDist = enriched.map(b => ({ name: b.locationName, value: b.totalRevenue }));
    const ordersDist = enriched.map(b => ({ name: b.locationName, value: b.totalOrders }));

    sendSuccess(res, {
      branches: enriched,
      summary: {
        totalOrders: branchStats.reduce((sum, b) => sum + b.totalOrders, 0),
        totalRevenue,
        highestRevenueBranch: locationMap[highestRegion?._id?.toString()] || 'N/A',
        numberOfRegions: branchStats.length,
      },
      charts: { revenueDist, ordersDist },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { from, to, source, shiftId, branchId } = req.query;
    const dateFilter = buildDateFilter(from, to);

    const orderFilter = {};
    if (dateFilter) orderFilter.createdAt = dateFilter;
    if (shiftId) orderFilter.shiftId = shiftId;
    if (branchId) orderFilter.locationId = branchId;

    const orders = await Order.find(orderFilter).populate('items.productId', 'name price');

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDiscounts = orders.filter(o => o.discountAmount > 0).length;
    const totalItemsOrdered = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0);

    const itemReport = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.productId?.name || 'Unknown';
        if (!itemReport[name]) itemReport[name] = { quantity: 0, total: 0 };
        itemReport[name].quantity += item.quantity || 0;
        itemReport[name].total += (item.price || 0) * (item.quantity || 0);
      });
    });
    const itemRows = Object.entries(itemReport).map(([name, data], idx) => ({
      index: idx + 1,
      name,
      quantity: data.quantity,
      total: data.total,
    })).sort((a, b) => b.quantity - a.quantity);

    const totalItemsSales = itemRows.reduce((sum, r) => sum + r.quantity, 0);
    const totalSalesValue = itemRows.reduce((sum, r) => sum + r.total, 0);
    const totalDiscountValue = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalTax = orders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const totalDelivery = orders.filter(o => o.type === 'takeaway').reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const grandTotal = totalSalesValue - totalDiscountValue + totalTax + totalDelivery;

    const dineInCash = orders.filter(o => o.type === 'dine_in' && o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.total || 0), 0);
    const cashOnDelivery = orders.filter(o => o.type === 'takeaway' && o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.total || 0), 0);
    const cashOnTakeaway = orders.filter(o => o.type === 'takeaway' && o.paymentMethod === 'card').reduce((sum, o) => sum + (o.total || 0), 0);

    const salesByPayment = [
      { method: 'Dine-in cash', amount: dineInCash },
      { method: 'Cash on Delivery', amount: cashOnDelivery },
      { method: 'Cash on Takeaway', amount: cashOnTakeaway },
      { method: 'Other Collections', amount: 0 },
      { method: 'Payments', amount: 0 },
    ];

    const totalTablesSales = orders.filter(o => o.type === 'dine_in').reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDeliverySales = orders.filter(o => o.type === 'takeaway').reduce((sum, o) => sum + (o.total || 0), 0);

    sendSuccess(res, {
      summary: { totalOrders, totalRevenue, totalDiscounts, totalItemsOrdered },
      itemReport: {
        rows: itemRows,
        totalItemsSales,
        totalSalesValue,
        totalDiscountValue,
        totalTax,
        totalDelivery,
        grandTotal,
      },
      salesByPayment,
      salesByType: [
        { method: 'Total Tables', amount: totalTablesSales },
        { method: 'Total Delivery', amount: totalDeliverySales },
        { method: 'Total Takeaway', amount: 0 },
      ],
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.exportData = async (req, res) => {
  try {
    const { type, from, to, detailed } = req.query;
    const dateFilter = buildDateFilter(from, to);
    const filter = {};
    if (dateFilter) filter.createdAt = dateFilter;

    let data = [];
    if (type === 'orders') {
      data = await Order.find(filter).populate('staffId', 'name').populate('items.productId', 'name price');
    } else if (type === 'inventory') {
      data = await Product.find().populate('categoryId', 'name');
    } else if (type === 'customers') {
      data = await Customer.find(filter);
    }

    sendSuccess(res, { type, count: data.length, data });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
