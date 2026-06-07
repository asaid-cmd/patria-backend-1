const { Warehouse, InternalTransfer } = require('../models/Warehouse');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).populate('manager', 'name email');
    const main = warehouses.filter(w => w.type === 'main');
    const sub = warehouses.filter(w => w.type === 'sub');
    sendSuccess(res, { mainWarehouses: main, subWarehouses: sub, warehouses });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const { name, type, address, manager } = req.body;
    if (!name) return sendError(res, 'Warehouse name is required', 400);

    const warehouseId = `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const warehouse = await Warehouse.create({ name, type, address, manager, warehouseId });
    sendSuccess(res, { warehouse }, 'Warehouse created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!warehouse) return sendError(res, 'Warehouse not found', 404);
    sendSuccess(res, { warehouse });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    await Warehouse.findByIdAndUpdate(id, { isActive: false });
    sendSuccess(res, null, 'Warehouse deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const transfers = await InternalTransfer.find()
      .populate('fromWarehouseId', 'name')
      .populate('toWarehouseId', 'name')
      .populate('transferredBy', 'name')
      .sort({ createdAt: -1 });

    sendSuccess(res, { transfers });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, items, notes } = req.body;

    if (!fromWarehouseId || !toWarehouseId || !items || !items.length) {
      return sendError(res, 'Source, destination, and items are required', 400);
    }
    if (fromWarehouseId === toWarehouseId) {
      return sendError(res, 'Source and destination cannot be the same', 400);
    }

    const enrichedItems = await Promise.all(items.map(async item => {
      const product = await Product.findById(item.productId).select('name');
      return { ...item, productName: product?.name || '' };
    }));

    const transfer = await InternalTransfer.create({
      fromWarehouseId,
      toWarehouseId,
      items: enrichedItems,
      notes,
      transferredBy: req.user?._id,
    });

    sendSuccess(res, { transfer }, 'Internal transfer created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const transfer = await InternalTransfer.findByIdAndUpdate(id, { status }, { new: true });
    if (!transfer) return sendError(res, 'Transfer not found', 404);
    sendSuccess(res, { transfer }, 'Transfer status updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
