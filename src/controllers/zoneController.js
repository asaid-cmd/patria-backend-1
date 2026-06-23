const Zone = require('../models/Zone');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, { zones });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.lookupZone = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return sendError(res, 'lat and lng are required', 400);

    const zones = await Zone.find({ isActive: true });
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const matched = zones.find(zone => {
      if (!zone.polygon || zone.polygon.length < 3) return false;
      return pointInPolygon([latNum, lngNum], zone.polygon);
    });

    if (!matched) {
      return sendError(res, 'No delivery zone found for this location', 404);
    }

    sendSuccess(res, { zone: matched });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    sendSuccess(res, { zone }, 'Zone created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return sendError(res, 'Zone not found', 404);
    sendSuccess(res, { zone }, 'Zone updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteZone = async (req, res) => {
  try {
    await Zone.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Zone deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

function pointInPolygon(point, polygon) {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
