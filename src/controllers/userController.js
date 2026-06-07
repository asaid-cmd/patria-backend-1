const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validate, validators } = require('../utils/validators');

exports.getAllUsers = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const users = await User.find({ isActive: true }).skip(skip).limit(limit);
    const total = await User.countDocuments({ isActive: true });

    sendSuccess(res, paginatedResult(users.map(u => u.toJSON()), total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { error, value } = validate(validators.createUserSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) return sendError(res, 'Email already exists', 409);

    const user = await User.create(value);
    sendSuccess(res, { user: user.toJSON() }, 'User created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.updateUserSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const user = await User.findByIdAndUpdate(id, value, { new: true, runValidators: true });

    if (!user) return sendError(res, 'User not found', 404);

    sendSuccess(res, { user: user.toJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Email already exists', 409);
    }
    sendError(res, error.message, 500, error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { isActive: false });

    sendSuccess(res, null, 'User deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
