const mongoose = require('mongoose');
const { RESERVATION_STATUS } = require('../config/constants');

const reservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  numberOfPeople: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
  },
  status: {
    type: String,
    enum: Object.values(RESERVATION_STATUS),
    default: RESERVATION_STATUS.ON_HOLD,
  },
  notes: String,
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
