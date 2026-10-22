const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const upload = require('../middleware/upload');

// Public expert profile & reviews
router.get('/:id', expertController.getExpertById);
router.get('/:id/reviews', expertController.getExpertReviews);

// Expert authenticated actions
router.post(
  '/apply',
  authenticateToken,
  requireRole('expert'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'id_doc', maxCount: 1 }
  ]),
  expertController.applyForVerification
);

router.get('/me/profile', authenticateToken, requireRole('expert'), expertController.getMyExpertProfile);
router.put('/me/profile', authenticateToken, requireRole('expert'), expertController.updateMyExpertProfile);
router.put('/me/availability', authenticateToken, requireRole('expert'), expertController.updateAvailability);

module.exports = router;
