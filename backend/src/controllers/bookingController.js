const { pool, query, execute } = require('../db/pool');

const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 0.20);

// Create a new booking request (Module M5)
async function createBooking(req, res) {
  const connection = await pool.getConnection();
  try {
    const user = req.user;
    const { expert_id, service_id, booking_date, time_slot, notes } = req.body;

    if (!expert_id || !service_id || !booking_date || !time_slot) {
      return res.status(400).json({
        success: false,
        message: 'expert_id, service_id, booking_date, and time_slot are required.'
      });
    }

    await connection.beginTransaction();

    // 1. Verify expert exists, is verified, and active
    const [expertRows] = await connection.query(
      `SELECT e.expert_id, e.user_id, e.verification_status, u.status as user_status 
       FROM experts e 
       JOIN users u ON e.user_id = u.user_id 
       WHERE e.expert_id = ? FOR UPDATE`,
      [expert_id]
    );

    if (expertRows.length === 0 || expertRows[0].verification_status !== 'verified' || expertRows[0].user_status === 'suspended') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Expert is unavailable or unverified.' });
    }

    if (expertRows[0].user_id === user.user_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'You cannot book your own expert profile.' });
    }

    // 2. Fetch service price from expert_services
    const [serviceRows] = await connection.query(
      'SELECT price, unit FROM expert_services WHERE expert_id = ? AND service_id = ?',
      [expert_id, service_id]
    );

    let amount = 500.00;
    if (serviceRows.length > 0) {
      amount = Number(serviceRows[0].price);
    }

    const commission = Number((amount * COMMISSION_RATE).toFixed(2));
    const expertEarning = Number((amount - commission).toFixed(2));

    // 3. Concurrency / Conflict Check: Ensure expert has NO active or requested booking for that date + slot
    const [conflictRows] = await connection.query(
      `SELECT booking_id FROM bookings 
       WHERE expert_id = ? 
         AND booking_date = ? 
         AND time_slot = ? 
         AND status IN ('requested', 'accepted') 
       FOR UPDATE`,
      [expert_id, booking_date, time_slot]
    );

    if (conflictRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'This expert already has a booking requested or confirmed for this date and time slot. Please choose another slot.'
      });
    }

    // 4. Insert booking
    const [insertResult] = await connection.query(
      `INSERT INTO bookings 
       (user_id, expert_id, service_id, booking_date, time_slot, status, payment_status, amount, commission, expert_earning, notes)
       VALUES (?, ?, ?, ?, ?, 'requested', 'unpaid', ?, ?, ?, ?)`,
      [user.user_id, expert_id, service_id, booking_date, time_slot, amount, commission, expertEarning, notes || '']
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Booking request sent successfully to the local expert.',
      booking: {
        booking_id: insertResult.insertId,
        expert_id,
        service_id,
        booking_date,
        time_slot,
        amount,
        commission,
        expert_earning: expertEarning,
        status: 'requested',
        payment_status: 'unpaid'
      }
    });

  } catch (err) {
    await connection.rollback();
    console.error('[CREATE BOOKING ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking: ' + err.message });
  } finally {
    connection.release();
  }
}

// Get bookings for logged-in user or expert
async function getMyBookings(req, res) {
  try {
    const user = req.user;

    if (user.role === 'expert') {
      // Find expert_id
      const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [user.user_id]);
      if (expertRows.length === 0) {
        return res.json({ success: true, bookings: [], earningsSummary: { total: 0, pending: 0, completed: 0 } });
      }
      const expertId = expertRows[0].expert_id;

      const bookings = await query(
        `SELECT b.*, u.name as newcomer_name, u.phone as newcomer_phone, u.email as newcomer_email,
                s.service_name, s.category
         FROM bookings b
         JOIN users u ON b.user_id = u.user_id
         JOIN services s ON b.service_id = s.service_id
         WHERE b.expert_id = ?
         ORDER BY b.created_at DESC`,
        [expertId]
      );

      // Calculate earnings summary
      let totalCompletedEarning = 0;
      let pendingEarning = 0;
      bookings.forEach(b => {
        if (b.status === 'completed' && b.payment_status === 'paid') {
          totalCompletedEarning += Number(b.expert_earning);
        } else if (['requested', 'accepted'].includes(b.status)) {
          pendingEarning += Number(b.expert_earning);
        }
      });

      return res.json({
        success: true,
        role: 'expert',
        earningsSummary: {
          totalEarned: Number(totalCompletedEarning.toFixed(2)),
          pendingEarned: Number(pendingEarning.toFixed(2)),
          completedBookingsCount: bookings.filter(b => b.status === 'completed').length,
          totalBookingsCount: bookings.length
        },
        bookings
      });
    } else {
      // Newcomer user bookings
      const bookings = await query(
        `SELECT b.*, 
                e.photo_url, e.occupation, 
                u.name as expert_name, u.phone as expert_phone,
                s.service_name, s.category,
                r.review_id, r.rating as user_review_rating, r.comment as user_review_comment
         FROM bookings b
         JOIN experts e ON b.expert_id = e.expert_id
         JOIN users u ON e.user_id = u.user_id
         JOIN services s ON b.service_id = s.service_id
         LEFT JOIN reviews r ON b.booking_id = r.booking_id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`,
        [user.user_id]
      );

      return res.json({
        success: true,
        role: 'user',
        bookings
      });
    }
  } catch (err) {
    console.error('[GET MY BOOKINGS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
}

// Expert accepts booking
async function acceptBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const user = req.user;

    const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [user.user_id]);
    if (expertRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Only experts can accept booking requests.' });
    }
    const expertId = expertRows[0].expert_id;

    const bookingRows = await query('SELECT * FROM bookings WHERE booking_id = ? AND expert_id = ?', [bookingId, expertId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRows[0];
    if (booking.status !== 'requested') {
      return res.status(400).json({ success: false, message: `Cannot accept booking with status '${booking.status}'.` });
    }

    await execute('UPDATE bookings SET status = "accepted" WHERE booking_id = ?', [bookingId]);

    return res.json({
      success: true,
      message: 'Booking accepted. Newcomer can now proceed with mock payment.',
      status: 'accepted'
    });
  } catch (err) {
    console.error('[ACCEPT BOOKING ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to accept booking.' });
  }
}

// Expert rejects booking
async function rejectBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const user = req.user;

    const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [user.user_id]);
    if (expertRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Only experts can decline booking requests.' });
    }
    const expertId = expertRows[0].expert_id;

    const bookingRows = await query('SELECT * FROM bookings WHERE booking_id = ? AND expert_id = ?', [bookingId, expertId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    await execute('UPDATE bookings SET status = "rejected" WHERE booking_id = ?', [bookingId]);

    return res.json({
      success: true,
      message: 'Booking declined.',
      status: 'rejected'
    });
  } catch (err) {
    console.error('[REJECT BOOKING ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to decline booking.' });
  }
}

// Cancel booking (by user or expert before service)
async function cancelBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const user = req.user;

    const bookingRows = await query('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRows[0];
    // Check ownership
    const isUserOwner = booking.user_id === user.user_id;
    let isExpertOwner = false;
    if (user.role === 'expert') {
      const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [user.user_id]);
      if (expertRows.length > 0 && expertRows[0].expert_id === booking.expert_id) {
        isExpertOwner = true;
      }
    }

    if (!isUserOwner && !isExpertOwner && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already completed service.' });
    }

    await execute('UPDATE bookings SET status = "cancelled" WHERE booking_id = ?', [bookingId]);

    return res.json({
      success: true,
      message: 'Booking cancelled.',
      status: 'cancelled'
    });
  } catch (err) {
    console.error('[CANCEL BOOKING ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
}

// Complete booking (Expert marks service done)
async function completeBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const user = req.user;

    const bookingRows = await query('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const booking = bookingRows[0];

    // Check expert or admin
    let isExpertOwner = false;
    if (user.role === 'expert') {
      const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [user.user_id]);
      if (expertRows.length > 0 && expertRows[0].expert_id === booking.expert_id) {
        isExpertOwner = true;
      }
    }

    if (!isExpertOwner && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned expert can mark service as completed.' });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: `Cannot complete booking with status '${booking.status}'. Must be accepted first.` });
    }

    await execute('UPDATE bookings SET status = "completed" WHERE booking_id = ?', [bookingId]);

    return res.json({
      success: true,
      message: 'Service marked as completed. The newcomer can now leave a verified review!',
      status: 'completed'
    });
  } catch (err) {
    console.error('[COMPLETE BOOKING ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete booking.' });
  }
}

// Mock Payment (Module M6)
async function mockPayBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const user = req.user;

    const bookingRows = await query('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const booking = bookingRows[0];

    if (booking.user_id !== user.user_id) {
      return res.status(403).json({ success: false, message: 'Only the booking newcomer can pay for this booking.' });
    }

    if (booking.status !== 'accepted' && booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payment can only be processed once expert has accepted the booking.' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking has already been paid.' });
    }

    // Process mock payment and record commission split
    await execute('UPDATE bookings SET payment_status = "paid" WHERE booking_id = ?', [bookingId]);

    return res.json({
      success: true,
      message: 'Mock payment processed successfully.',
      receipt: {
        booking_id: booking.booking_id,
        total_amount: booking.amount,
        platform_commission_20pct: booking.commission,
        expert_payout_80pct: booking.expert_earning,
        payment_status: 'paid',
        payment_method: 'Mock Payment Gateway (College MVP Sandbox)'
      }
    });
  } catch (err) {
    console.error('[MOCK PAY ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Payment simulation failed.' });
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  mockPayBooking
};
