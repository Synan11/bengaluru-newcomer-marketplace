const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

router.post('/:id', authenticateToken, reviewController.submitReview);

module.exports = router;
