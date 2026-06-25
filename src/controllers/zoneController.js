const Zone = require('../models/Zone');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Map our Zone schema fields to ERB's ZonePublic/ZoneLookupResult field names
function zoneShape(z) {
  return {
    _id:              z._id,
    name:             z.name,
    nameAr:           z.nameAr,
    deliveryFee:      z.deliveryFee,
    minOrderAmount:   z.minOrder || z.minOrderAmount || 0,
    estimatedMinutes: z.estimatedMinutes,
    deliverySchedule: z.deliverySchedule || [],
    status:           z.isActive ? 'Available' : 'Unavailable',
  };
}

// Mobile: returns bare array (ERB shape)
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    res.json(zones.map(zoneShape));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.lookupZone = async (req, res) => {
  try {
    let { lat, lng, addressId, zoneId, zone: zoneName, name } = req.query;
    // Accept ?name= as alias for ?zone= (Flutter sends name param)
    if (!zoneName && name) zoneName = name;

    // 1. If addressId provided, fetch coordinates from customer's saved address
    if ((!lat || !lng) && addressId && req.user?.id) {
      const customer = await Customer.findById(req.user.id).select('addresses');
      const addr = customer?.addresses?.find(a => String(a._id) === addressId);
      if (addr) {
        if (addr.lat && addr.lng) { lat = addr.lat; lng = addr.lng; }
        if (!zoneId && addr.zoneId) zoneId = String(addr.zoneId);
        if (!zoneName && addr.zone) zoneName = addr.zone;
      }
    }

    const zones = await Zone.find({ isActive: true });

    // 2. Try polygon match with lat/lng
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const matched = zones.find(zone => {
          if (!zone.polygon || zone.polygon.length < 3) return false;
          return pointInPolygon([latNum, lngNum], zone.polygon);
        });
        if (matched) return res.json(zoneShape(matched));
      }
    }

    // 3. Fallback: match by zoneId
    if (zoneId) {
      const matched = zones.find(z => String(z._id) === zoneId);
      if (matched) return res.json(zoneShape(matched));
    }

    // 4. Fallback: match by zone name
    if (zoneName) {
      const matched = zones.find(z =>
        z.name?.toLowerCase() === zoneName.toLowerCase() ||
        z.nameAr === zoneName
      );
      if (matched) return res.json(zoneShape(matched));
    }

    // 5. No zone found — return first active zone or null with 0 fee (never block checkout)
    const fallback = zones[0] || null;
    res.json(fallback ? zoneShape(fallback) : null);
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
