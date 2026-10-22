const bcrypt = require('bcryptjs');
const { query, execute } = require('../db/pool');
const { generateToken } = require('../middleware/auth');

// Register user or expert
async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required.'
      });
    }

    const assignedRole = role === 'expert' ? 'expert' : 'user';

    // Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userResult = await execute(
      'INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), phone.trim(), passwordHash, assignedRole, 'active']
    );

    const userId = userResult.insertId;

    let expertId = null;
    // If expert, create initial experts row
    if (assignedRole === 'expert') {
      const expertResult = await execute(
        'INSERT INTO experts (user_id, verification_status, years_in_city) VALUES (?, ?, ?)',
        [userId, 'pending', 1]
      );
      expertId = expertResult.insertId;
    }

    const user = {
      user_id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: assignedRole,
      status: 'active',
      expert_id: expertId
    };

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user
    });
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
}

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const users = await query(
      'SELECT user_id, name, email, phone, password_hash, role, status FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact platform administration.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    let expertInfo = null;
    if (user.role === 'expert') {
      const expertRows = await query(
        'SELECT expert_id, verification_status, rating_sum, rating_count, photo_url, occupation FROM experts WHERE user_id = ?',
        [user.user_id]
      );
      if (expertRows.length > 0) {
        expertInfo = expertRows[0];
      }
    }

    const safeUser = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      expert_id: expertInfo ? expertInfo.expert_id : null,
      verification_status: expertInfo ? expertInfo.verification_status : null,
      photo_url: expertInfo ? expertInfo.photo_url : null
    };

    const token = generateToken(safeUser);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
}

// Get current profile
async function getMe(req, res) {
  try {
    const user = req.user;
    let expert = null;

    if (user.role === 'expert') {
      const expertRows = await query(
        `SELECT e.*, 
          GROUP_CONCAT(DISTINCT a.area_name) as areas_list,
          GROUP_CONCAT(DISTINCT l.name) as languages_list
        FROM experts e
        LEFT JOIN expert_areas ea ON e.expert_id = ea.expert_id
        LEFT JOIN areas a ON ea.area_id = a.area_id
        LEFT JOIN expert_languages el ON e.expert_id = el.expert_id
        LEFT JOIN languages l ON el.language_id = l.language_id
        WHERE e.user_id = ?
        GROUP BY e.expert_id`,
        [user.user_id]
      );
      if (expertRows.length > 0) {
        expert = expertRows[0];
      }
    }

    return res.json({
      success: true,
      user,
      expert
    });
  } catch (err) {
    console.error('[AUTH ME ERROR]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile details.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe
};
