const { ProductionBatch, Equipment, EquipmentServiceLog } = require('../models/Production');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');

// --- Production Batches ---

exports.getBatches = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { roastingDegree, status } = req.query;

    const filter = {};
    if (roastingDegree) filter.roastingDegree = roastingDegree;
    if (status) filter.status = status;

    const batches = await ProductionBatch.find(filter)
      .populate('productId', 'name')
      .populate('qualityVerifiedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProductionBatch.countDocuments(filter);

    const allBatches = await ProductionBatch.find();
    const totalWeightKg = allBatches.reduce((sum, b) => sum + (b.weightAfter || 0), 0);
    const completedBatches = allBatches.filter(b => b.status === 'completed');
    const efficiency = allBatches.length
      ? Math.round((completedBatches.length / allBatches.length) * 1000) / 10
      : 0;

    sendSuccess(res, {
      ...paginatedResult(batches, total, page, limit),
      stats: {
        totalBatches: allBatches.length,
        totalWeightKg: Math.round(totalWeightKg * 100) / 100,
        efficiency,
        completedBatches: completedBatches.length,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { productId, productName, roastingDegree, weightBefore, weightAfter, date, ingredients, notes } = req.body;

    if (!productName) return sendError(res, 'Product name is required', 400);

    const batch = await ProductionBatch.create({
      productId,
      productName,
      roastingDegree: roastingDegree || 'medium',
      weightBefore,
      weightAfter,
      outputMass: weightAfter,
      date: date ? new Date(date) : new Date(),
      ingredients: ingredients || [],
      notes,
    });

    sendSuccess(res, { batch }, 'Production batch created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.verifyQuality = async (req, res) => {
  try {
    const { id } = req.params;
    const { outputMass, moisturePercent, agtronIndex, cuppingScore } = req.body;

    const batch = await ProductionBatch.findById(id);
    if (!batch) return sendError(res, 'Batch not found', 404);
    if (batch.status === 'completed') return sendError(res, 'Batch already completed', 400);

    batch.outputMass = outputMass || batch.outputMass;
    batch.moisturePercent = moisturePercent;
    batch.agtronIndex = agtronIndex;
    batch.cuppingScore = cuppingScore;
    batch.status = 'completed';
    batch.qualityVerifiedAt = new Date();
    batch.qualityVerifiedBy = req.user?._id;
    await batch.save();

    sendSuccess(res, { batch }, 'Quality check completed');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const batch = await ProductionBatch.findByIdAndUpdate(id, { status }, { new: true });
    if (!batch) return sendError(res, 'Batch not found', 404);
    sendSuccess(res, { batch });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

// --- Equipment ---

exports.getEquipment = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isActive: true };
    if (status) filter.status = status;

    const equipment = await Equipment.find(filter).sort({ name: 1 });
    sendSuccess(res, { equipment });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const { name, type, operation, lastServiceDate, nextServiceDate, serviceCost } = req.body;
    if (!name || !type) return sendError(res, 'Name and type are required', 400);

    const equipment = await Equipment.create({ name, type, operation, lastServiceDate, nextServiceDate, serviceCost });
    sendSuccess(res, { equipment }, 'Equipment created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findByIdAndUpdate(id, req.body, { new: true });
    if (!equipment) return sendError(res, 'Equipment not found', 404);
    sendSuccess(res, { equipment });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.logEquipmentService = async (req, res) => {
  try {
    const { id } = req.params;
    const { machineDesignation, serviceType, financialOutlay, nextRecalibrationDeadline, notes } = req.body;

    const equipment = await Equipment.findById(id);
    if (!equipment) return sendError(res, 'Equipment not found', 404);

    const log = await EquipmentServiceLog.create({
      equipmentId: id,
      machineDesignation,
      serviceType,
      financialOutlay,
      nextRecalibrationDeadline,
      performedBy: req.user?._id,
      notes,
    });

    equipment.lastServiceDate = new Date();
    if (nextRecalibrationDeadline) equipment.nextServiceDate = new Date(nextRecalibrationDeadline);
    if (financialOutlay) equipment.serviceCost = financialOutlay;
    await equipment.save();

    sendSuccess(res, { log }, 'Service log recorded', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getEquipmentServiceLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await EquipmentServiceLog.find({ equipmentId: id })
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 });
    sendSuccess(res, { logs });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
