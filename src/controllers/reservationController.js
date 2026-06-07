const Reservation = require('../models/Reservation');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = {};
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    if (status) query.status = status;

    const reservations = await Reservation.find(query).populate('tableId').skip(skip).limit(limit).sort({ date: 1 });
    const total = await Reservation.countDocuments(query);
    sendSuccess(res, paginatedResult(reservations, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { error, value } = validate(validators.createReservationSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const reservation = await Reservation.create(value);
    sendSuccess(res, { reservation: await reservation.populate('tableId') }, 'Reservation created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(id, { status }, { new: true });
    if (!reservation) return sendError(res, 'Reservation not found', 404);
    sendSuccess(res, { reservation });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    await Reservation.findByIdAndDelete(id);
    sendSuccess(res, null, 'Reservation deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
