const mongoose = require('mongoose');

const productionBatchSchema = new mongoose.Schema({
  batchNumber: { type: String, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  roastingDegree: { type: String, enum: ['light', 'medium', 'dark'], default: 'medium' },
  weightBefore: { type: Number },
  weightAfter: { type: Number },
  outputMass: { type: Number },
  moisturePercent: Number,
  agtronIndex: Number,
  cuppingScore: Number,
  ingredients: [{
    name: String,
    quantity: Number,
    unit: String,
  }],
  status: {
    type: String,
    enum: ['in_progress', 'quality_check', 'completed', 'rejected'],
    default: 'in_progress',
  },
  qualityVerifiedAt: Date,
  qualityVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

productionBatchSchema.pre('save', async function (next) {
  if (!this.batchNumber) {
    const count = await mongoose.model('ProductionBatch').countDocuments();
    this.batchNumber = `B-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.weightBefore && this.weightAfter) {
    this.outputMass = this.weightAfter;
  }
  next();
});

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  operation: String,
  lastServiceDate: Date,
  nextServiceDate: Date,
  serviceCost: Number,
  status: { type: String, enum: ['operational', 'maintenance', 'faulty'], default: 'operational' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const equipmentServiceLogSchema = new mongoose.Schema({
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  machineDesignation: String,
  serviceType: String,
  financialOutlay: Number,
  nextRecalibrationDeadline: Date,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  serviceDate: { type: Date, default: Date.now },
}, { timestamps: true });

const ProductionBatch = mongoose.model('ProductionBatch', productionBatchSchema);
const Equipment = mongoose.model('Equipment', equipmentSchema);
const EquipmentServiceLog = mongoose.model('EquipmentServiceLog', equipmentServiceLogSchema);

module.exports = { ProductionBatch, Equipment, EquipmentServiceLog };
