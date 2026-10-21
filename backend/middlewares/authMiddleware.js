const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const getTokenFromReq = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (let c of rawCookies) {
      const [key, value] = c.trim().split('=');
      if (key === 'token') return value;
    }
  }
  if (req.headers.authorization?.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. Please login.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campuscollab_jwt_secret_key_30min_session');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found.' });
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

module.exports = { protect, adminOnly };
