const Location = require('../models/Location');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validators, validate } = require('../utils/validators');

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('manager', 'name email');
    const active = locations.filter(l => l.isActive).length;
    const inactive = locations.filter(l => !l.isActive).length;
    sendSuccess(res, { locations, stats: { total: locations.length, active, inactive } });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { error, value } = validate(validators.createDeliveryZoneSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const location = await Location.create(value);
    sendSuccess(res, { location }, 'Delivery zone created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.updateDeliveryZoneSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const location = await Location.findByIdAndUpdate(id, value, { new: true, runValidators: true });
    if (!location) return sendError(res, 'Location not found', 404);
    sendSuccess(res, { location });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);
    if (!location) return sendError(res, 'Location not found', 404);

    location.isActive = !location.isActive;
    await location.save();
    sendSuccess(res, { location }, 'Status updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByIdAndDelete(id);
    if (!location) return sendError(res, 'Location not found', 404);
    sendSuccess(res, null, 'Delivery zone deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
