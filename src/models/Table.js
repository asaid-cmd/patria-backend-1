const mongoose = require('mongoose');
const { TABLE_SECTIONS, TABLE_STATUS } = require('../config/constants');

const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  capacity: { type: Number, required: true },
  section: {
    type: String,
    enum: Object.values(TABLE_SECTIONS),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TABLE_STATUS),
    default: TABLE_STATUS.AVAILABLE,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
}, { timestamps: true });

tableSchema.index({ number: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
