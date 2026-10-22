const { pool, query } = require('../db/pool');

// Post review for completed booking (Module M7)
async function submitReview(req, res) {
  const connection = await pool.getConnection();
  try {
    const bookingId = Number(req.params.id);
    const user = req.user;
    const { rating, comment } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    await connection.beginTransaction();

    // 1. Fetch booking with lock
    const [bookingRows] = await connection.query(
      'SELECT booking_id, user_id, expert_id, status FROM bookings WHERE booking_id = ? FOR UPDATE',
      [bookingId]
    );

    if (bookingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRows[0];

    // Rule: Only real customers review
    if (booking.user_id !== user.user_id) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Only the newcomer who booked and received this service can submit a review.' });
    }

    // Rule: Booking must be completed
    if (booking.status !== 'completed') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Cannot review an uncompleted booking. Current status: '${booking.status}'.` });
    }

    // Rule: One review per booking
    const [existingReviews] = await connection.query(
      'SELECT review_id FROM reviews WHERE booking_id = ?',
      [bookingId]
    );
    if (existingReviews.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'You have already reviewed this completed booking.' });
    }

    // 2. Insert Review
    const [reviewResult] = await connection.query(
      'INSERT INTO reviews (booking_id, user_id, expert_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [bookingId, user.user_id, booking.expert_id, numericRating, comment || '']
    );

    // 3. Update expert rating_sum and rating_count in same transaction
    await connection.query(
      'UPDATE experts SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE expert_id = ?',
      [numericRating, booking.expert_id]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Verified review submitted successfully. Expert smoothed rating updated.',
      review_id: reviewResult.insertId,
      rating: numericRating,
      comment
    });

  } catch (err) {
    await connection.rollback();
    console.error('[SUBMIT REVIEW ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit review: ' + err.message });
  } finally {
    connection.release();
  }
}

module.exports = {
  submitReview
};
