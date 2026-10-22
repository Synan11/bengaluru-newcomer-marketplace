const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, bookingController.createBooking);
router.get('/mine', authenticateToken, bookingController.getMyBookings);
router.patch('/:id/accept', authenticateToken, bookingController.acceptBooking);
router.patch('/:id/reject', authenticateToken, bookingController.rejectBooking);
router.patch('/:id/cancel', authenticateToken, bookingController.cancelBooking);
router.patch('/:id/complete', authenticateToken, bookingController.completeBooking);
router.post('/:id/pay', authenticateToken, bookingController.mockPayBooking);

module.exports = router;
