const Table = require('../models/Table');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validate, validators } = require('../utils/validators');

exports.getTables = async (req, res) => {
  try {
    const { section, locationId } = req.query;
    const { skip, limit, page } = getPaginationParams(req.query);
    const query = {};
    if (section) query.section = section;
    if (locationId) query.locationId = locationId;

    const tables = await Table.find(query).skip(skip).limit(limit);
    const total = await Table.countDocuments(query);
    sendSuccess(res, paginatedResult(tables, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createTable = async (req, res) => {
  try {
    const { error, value } = validate(validators.createTableSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const table = await Table.create(value);
    sendSuccess(res, { table }, 'Table created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await Table.findByIdAndUpdate(id, { status }, { new: true });
    if (!table) return sendError(res, 'Table not found', 404);

    sendSuccess(res, { table });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    await Table.findByIdAndDelete(id);
    sendSuccess(res, null, 'Table deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
