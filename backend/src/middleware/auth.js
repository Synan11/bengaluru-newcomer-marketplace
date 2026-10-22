const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'bengaluru_newcomer_jwt_super_secret_key_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB to verify active status
    const users = await query('SELECT user_id, name, email, phone, role, status FROM users WHERE user_id = ?', [decoded.user_id]);
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    const user = users[0];
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by administration due to policy or safety reports.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};
