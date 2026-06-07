const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validate, validators } = require('../utils/validators');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { error, value } = validate(validators.registerSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return sendError(res, 'Email already registered', 409);
    }

    const user = await User.create({
      name: value.name,
      email: value.email,
      password: value.password,
      role: 'superadmin',
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    sendSuccess(res, { user: user.toJSON(), accessToken, refreshToken }, 'Registered successfully', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { error, value } = validate(validators.loginSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const user = await User.findOne({ email: value.email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(value.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    sendSuccess(res, { user: user.toJSON(), accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token required', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

    await RefreshToken.updateOne(
      { token: refreshToken },
      { revokedAt: new Date() }
    );

    await RefreshToken.create({
      token: newRefreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    sendError(res, 'Invalid refresh token', 401, error);
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await RefreshToken.updateOne(
        { token },
        { revokedAt: new Date() }
      );
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendSuccess(res, null, 'If email exists, password reset link sent');
    }

    sendSuccess(res, null, 'If email exists, password reset link sent');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    sendSuccess(res, user.toJSON());
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};
