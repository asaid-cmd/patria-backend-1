const mongoose = require('mongoose');

const internalTransferSchema = new mongoose.Schema({
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: { type: Number, required: true },
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  notes: String,
  transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transferDate: { type: Date, default: Date.now },
}, { timestamps: true });

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['main', 'sub'], default: 'main' },
  address: String,
  warehouseId: { type: String },
  kitchenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kitchen' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const InternalTransfer = mongoose.model('InternalTransfer', internalTransferSchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = { Warehouse, InternalTransfer };
