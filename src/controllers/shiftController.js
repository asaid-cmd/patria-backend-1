const Shift = require('../models/Shift');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validators, validate } = require('../utils/validators');

exports.openShift = async (req, res) => {
  try {
    const { error, value } = validate(validators.openShiftSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const { cashierId, locationId, openingBalance } = value;
    const activeShift = await Shift.findOne({ cashierId, status: 'open' });
    if (activeShift) return sendError(res, 'Shift already open for this cashier', 400);

    const shift = await Shift.create({ cashierId, locationId, openingBalance, status: 'open' });
    sendSuccess(res, { shift }, 'Shift opened', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.closeShift = async (req, res) => {
  try {
    const { error, value } = validate(validators.closeShiftSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const { shiftId, closingBalance, notes } = value;
    const shift = await Shift.findById(shiftId);
    if (!shift) return sendError(res, 'Shift not found', 404);
    if (shift.status !== 'open') return sendError(res, 'Shift is not open', 400);

    shift.closedAt = new Date();
    shift.closingBalance = closingBalance;
    shift.notes = notes;
    shift.status = 'closed';
    await shift.save();

    sendSuccess(res, { shift });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getCurrentShift = async (req, res) => {
  try {
    const { cashierId } = req.query;
    const shift = await Shift.findOne({ cashierId, status: 'open' }).populate('orderIds');
    if (!shift) return sendError(res, 'No open shift found', 404);
    sendSuccess(res, { shift });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getShiftSummary = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const shift = await Shift.findById(shiftId).populate('orderIds');
    if (!shift) return sendError(res, 'Shift not found', 404);
    sendSuccess(res, { shift });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
