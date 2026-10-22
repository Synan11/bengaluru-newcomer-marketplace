const { query, execute } = require('../db/pool');

// Report an expert or booking (Module M8)
async function submitReport(req, res) {
  try {
    const user = req.user;
    const { reported_user_id, expert_id, booking_id, reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A reason or description of the safety concern is required.' });
    }

    let targetUserId = reported_user_id;

    // If expert_id was passed, resolve to user_id
    if (!targetUserId && expert_id) {
      const expertRows = await query('SELECT user_id FROM experts WHERE expert_id = ?', [expert_id]);
      if (expertRows.length > 0) {
        targetUserId = expertRows[0].user_id;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user or expert to report is required.' });
    }

    const result = await execute(
      'INSERT INTO reports (reporter_id, reported_user_id, booking_id, reason, status) VALUES (?, ?, ?, ?, "open")',
      [user.user_id, targetUserId, booking_id || null, reason.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Safety report submitted. Platform administrators will investigate.',
      report_id: result.insertId
    });
  } catch (err) {
    console.error('[SUBMIT REPORT ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit report: ' + err.message });
  }
}

module.exports = {
  submitReport
};
