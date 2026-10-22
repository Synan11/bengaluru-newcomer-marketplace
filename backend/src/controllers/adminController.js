const path = require('path');
const fs = require('fs');
const { pool, query, execute } = require('../db/pool');
const { performSensitivityAnalysis, rankExperts } = require('../services/ranking');

// List experts by status (e.g., pending, verified, suspended)
async function getAdminExperts(req, res) {
  try {
    const { status } = req.query;

    let sql = `
      SELECT e.*, u.name, u.email, u.phone, u.status as user_status,
             v.verification_id, v.id_doc_url, v.remarks as admin_remarks, v.reviewed_at
      FROM experts e
      JOIN users u ON e.user_id = u.user_id
      LEFT JOIN verifications v ON e.expert_id = v.expert_id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE e.verification_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.created_at DESC';

    const experts = await query(sql, params);

    return res.json({
      success: true,
      count: experts.length,
      experts
    });
  } catch (err) {
    console.error('[ADMIN GET EXPERTS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve experts.' });
  }
}

// Update expert verification status (verify, reject, suspend)
async function updateExpertStatus(req, res) {
  const connection = await pool.getConnection();
  try {
    const expertId = Number(req.params.id);
    const adminUser = req.user;
    const { verification_status, remarks } = req.body;

    const validStatuses = ['pending', 'under_review', 'verified', 'rejected', 'suspended'];
    if (!validStatuses.includes(verification_status)) {
      return res.status(400).json({ success: false, message: `Invalid status '${verification_status}'.` });
    }

    await connection.beginTransaction();

    const [expertRows] = await connection.query(
      'SELECT expert_id, user_id FROM experts WHERE expert_id = ? FOR UPDATE',
      [expertId]
    );

    if (expertRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Expert not found.' });
    }

    const expert = expertRows[0];

    // 1. Update expert verification_status
    await connection.query(
      'UPDATE experts SET verification_status = ? WHERE expert_id = ?',
      [verification_status, expertId]
    );

    // 2. Insert / Update verification log
    await connection.query(
      `INSERT INTO verifications (expert_id, admin_id, id_doc_url, doc_status, admin_status, remarks, reviewed_at)
       VALUES (?, ?, 'admin_action', ?, ?, ?, NOW())`,
      [
        expertId, 
        adminUser.user_id, 
        verification_status === 'verified' ? 'verified' : (verification_status === 'rejected' ? 'rejected' : 'submitted'),
        verification_status, 
        remarks || `Status updated to ${verification_status} by Admin.`
      ]
    );

    // 3. If suspended: update user status and cancel any pending or accepted bookings
    if (verification_status === 'suspended') {
      await connection.query('UPDATE users SET status = "suspended" WHERE user_id = ?', [expert.user_id]);

      await connection.query(
        `UPDATE bookings 
         SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), ' [Admin cancelled: Expert suspended]')
         WHERE expert_id = ? AND status IN ('requested', 'accepted')`,
        [expertId]
      );
    } else if (verification_status === 'verified') {
      // Ensure user status is active
      await connection.query('UPDATE users SET status = "active" WHERE user_id = ?', [expert.user_id]);
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Expert status updated to '${verification_status}'.`,
      expert_id: expertId,
      verification_status
    });

  } catch (err) {
    await connection.rollback();
    console.error('[ADMIN UPDATE EXPERT ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update expert status.' });
  } finally {
    connection.release();
  }
}

// List safety reports (Module M8)
async function getAdminReports(req, res) {
  try {
    const { status } = req.query;

    let sql = `
      SELECT r.*, 
             u1.name as reporter_name, u1.email as reporter_email,
             u2.name as reported_name, u2.email as reported_email, u2.role as reported_role,
             b.service_id, b.status as booking_status, s.service_name
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.user_id
      JOIN users u2 ON r.reported_user_id = u2.user_id
      LEFT JOIN bookings b ON r.booking_id = b.booking_id
      LEFT JOIN services s ON b.service_id = s.service_id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const reports = await query(sql, params);

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    console.error('[ADMIN GET REPORTS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
}

// Update safety report status & admin notes
async function updateReportStatus(req, res) {
  try {
    const reportId = Number(req.params.id);
    const { status, admin_notes } = req.body;

    const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    await execute(
      'UPDATE reports SET status = ?, admin_notes = COALESCE(?, admin_notes) WHERE report_id = ?',
      [status, admin_notes || null, reportId]
    );

    return res.json({
      success: true,
      message: `Report status updated to '${status}'.`,
      report_id: reportId
    });
  } catch (err) {
    console.error('[ADMIN UPDATE REPORT ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
}

// Get all bookings across the platform with financial commission analytics
async function getAdminBookings(req, res) {
  try {
    const bookings = await query(
      `SELECT b.*, 
              u.name as newcomer_name, u.email as newcomer_email,
              ue.name as expert_name, ue.email as expert_email,
              s.service_name, s.category
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN experts e ON b.expert_id = e.expert_id
       JOIN users ue ON e.user_id = ue.user_id
       JOIN services s ON b.service_id = s.service_id
       ORDER BY b.created_at DESC`
    );

    let totalVolume = 0;
    let totalCommission = 0;
    let totalExpertPayouts = 0;

    bookings.forEach(b => {
      if (b.payment_status === 'paid') {
        totalVolume += Number(b.amount);
        totalCommission += Number(b.commission);
        totalExpertPayouts += Number(b.expert_earning);
      }
    });

    return res.json({
      success: true,
      metrics: {
        totalBookings: bookings.length,
        paidBookings: bookings.filter(b => b.payment_status === 'paid').length,
        totalTransactionVolume: Number(totalVolume.toFixed(2)),
        platformCommissionCollected: Number(totalCommission.toFixed(2)),
        expertEarningsDisbursed: Number(totalExpertPayouts.toFixed(2))
      },
      bookings
    });
  } catch (err) {
    console.error('[ADMIN GET BOOKINGS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
}

// Get platform users
async function getAdminUsers(req, res) {
  try {
    const users = await query('SELECT user_id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC');
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('[ADMIN GET USERS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

// Hide or unhide a fraudulent review
async function toggleHideReview(req, res) {
  try {
    const reviewId = Number(req.params.id);
    const { is_hidden } = req.body;

    await execute('UPDATE reviews SET is_hidden = ? WHERE review_id = ?', [Boolean(is_hidden), reviewId]);

    return res.json({
      success: true,
      message: `Review has been ${is_hidden ? 'hidden from public view' : 'restored'}.`,
      review_id: reviewId,
      is_hidden: Boolean(is_hidden)
    });
  } catch (err) {
    console.error('[ADMIN HIDE REVIEW ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update review status.' });
  }
}

// Securely serve protected ID documents only to admins
async function getProtectedIdDoc(req, res) {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'id_docs', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Document not found on server.');
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('[ADMIN ID DOC ERROR]:', err);
    return res.status(500).send('Error retrieving document.');
  }
}

// Academic Viva Endpoint: Run Sensitivity Analysis on live database experts
async function runSensitivityTest(req, res) {
  try {
    const expertRows = await query(
      `SELECT e.expert_id, e.user_id, e.rating_sum, e.rating_count, u.name
       FROM experts e 
       JOIN users u ON e.user_id = u.user_id 
       WHERE e.verification_status = 'verified'`
    );

    const expertIds = expertRows.map(e => e.expert_id);
    if (expertIds.length === 0) {
      return res.json({ success: true, message: 'No verified experts in DB.' });
    }

    const servicesRows = await query(`SELECT expert_id, service_id FROM expert_services WHERE expert_id IN (${expertIds.join(',')})`);
    const areasRows = await query(`SELECT expert_id, area_id FROM expert_areas WHERE expert_id IN (${expertIds.join(',')})`);
    const languagesRows = await query(`SELECT expert_id, language_id FROM expert_languages WHERE expert_id IN (${expertIds.join(',')})`);
    const slotsRows = await query(`SELECT expert_id, weekday, time_slot FROM availability_slots WHERE expert_id IN (${expertIds.join(',')})`);

    const formatted = expertRows.map(e => ({
      id: e.expert_id,
      name: e.name,
      ratingSum: Number(e.rating_sum),
      ratingCount: Number(e.rating_count),
      services: servicesRows.filter(s => s.expert_id === e.expert_id).map(s => s.service_id),
      areas: areasRows.filter(a => a.expert_id === e.expert_id).map(a => a.area_id),
      languages: languagesRows.filter(l => l.expert_id === e.expert_id).map(l => l.language_id),
      freeSlots: slotsRows.filter(s => s.expert_id === e.expert_id).map(s => `${s.weekday}_${s.time_slot}`)
    }));

    const sampleRequest = {
      needs: [1, 2],
      areaId: 1, // Koramangala
      languages: [3], // Hindi
      slot: 'Saturday_morning'
    };

    const sensitivityResults = performSensitivityAnalysis(formatted, sampleRequest, 0.10);

    return res.json({
      success: true,
      analysis: sensitivityResults
    });
  } catch (err) {
    console.error('[SENSITIVITY TEST ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Sensitivity test failed.' });
  }
}

module.exports = {
  getAdminExperts,
  updateExpertStatus,
  getAdminReports,
  updateReportStatus,
  getAdminBookings,
  getAdminUsers,
  toggleHideReview,
  getProtectedIdDoc,
  runSensitivityTest
};
