/**
 * Auth middleware
 * Errors return ERB-compatible flat JSON: { message: "..." }
 * Supports both JWT_ACCESS_SECRET (Patria) and JWT_SECRET (ERB legacy) env vars.
 */

const jwt          = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'غير مصرح — لا يوجد رمز مصادقة' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'رمز المصادقة غير صالح أو منتهي الصلاحية' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'غير مصرح' });

    // Mobile customer tokens carry no `role` → treat as 'user'
    const role = req.user.role || 'user';

    // superadmin bypasses all role checks
    if (role === 'superadmin') return next();

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'ممنوع — صلاحيات غير كافية' });
    }

    next();
  };
};

module.exports = { verifyToken, authorize };
