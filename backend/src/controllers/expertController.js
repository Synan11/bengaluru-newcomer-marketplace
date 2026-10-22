const { query, execute } = require('../db/pool');
const { calculateTrust } = require('../services/ranking');

// Apply for expert verification (Module M2)
async function applyForVerification(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Only accounts with role "expert" can submit verification applications.' });
    }

    // Get expert record
    const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [user.user_id]);
    let expertId;
    if (expertRows.length === 0) {
      const ins = await execute('INSERT INTO experts (user_id, verification_status) VALUES (?, ?)', [user.user_id, 'pending']);
      expertId = ins.insertId;
    } else {
      expertId = expertRows[0].expert_id;
    }

    const { occupation, intro, years_in_city, services, areas, languages } = req.body;

    const photoFile = req.files && req.files.photo ? req.files.photo[0] : null;
    const idDocFile = req.files && req.files.id_doc ? req.files.id_doc[0] : null;

    if (!idDocFile) {
      return res.status(400).json({ success: false, message: 'An identity proof document (Aadhaar, Passport, or College ID) is required for verification.' });
    }

    const photoUrl = photoFile ? `/uploads/photos/${photoFile.filename}` : null;
    const idDocUrl = `/uploads/id_docs/${idDocFile.filename}`;

    // Update expert profile info
    await execute(
      `UPDATE experts 
       SET occupation = ?, intro = ?, years_in_city = ?, verification_status = 'pending'
       ${photoUrl ? ', photo_url = ?' : ''}
       WHERE expert_id = ?`,
      photoUrl
        ? [occupation || 'Local Expert', intro || '', Number(years_in_city) || 1, photoUrl, expertId]
        : [occupation || 'Local Expert', intro || '', Number(years_in_city) || 1, expertId]
    );

    // Insert verification request
    await execute(
      'INSERT INTO verifications (expert_id, id_doc_url, doc_status, admin_status, remarks) VALUES (?, ?, ?, ?, ?)',
      [expertId, idDocUrl, 'submitted', 'pending', 'Application submitted by expert. Awaiting review.']
    );

    // Update services if provided
    if (services) {
      const parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
      if (Array.isArray(parsedServices)) {
        await execute('DELETE FROM expert_services WHERE expert_id = ?', [expertId]);
        for (const s of parsedServices) {
          if (s.service_id) {
            await execute(
              'INSERT INTO expert_services (expert_id, service_id, price, unit) VALUES (?, ?, ?, ?)',
              [expertId, s.service_id, s.price || 400.00, s.unit || 'per_hour']
            );
          }
        }
      }
    }

    // Update areas if provided
    if (areas) {
      const parsedAreas = typeof areas === 'string' ? JSON.parse(areas) : areas;
      if (Array.isArray(parsedAreas)) {
        await execute('DELETE FROM expert_areas WHERE expert_id = ?', [expertId]);
        for (const aId of parsedAreas) {
          await execute('INSERT INTO expert_areas (expert_id, area_id) VALUES (?, ?)', [expertId, aId]);
        }
      }
    }

    // Update languages if provided
    if (languages) {
      const parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
      if (Array.isArray(parsedLanguages)) {
        await execute('DELETE FROM expert_languages WHERE expert_id = ?', [expertId]);
        for (const lId of parsedLanguages) {
          await execute('INSERT INTO expert_languages (expert_id, language_id) VALUES (?, ?)', [expertId, lId]);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Verification application submitted successfully. Your profile will be reviewed by admin.',
      verification_status: 'pending'
    });
  } catch (err) {
    console.error('[EXPERT APPLY ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit application: ' + err.message });
  }
}

// Get logged in expert profile & full relational details
async function getMyExpertProfile(req, res) {
  try {
    const expertRows = await query('SELECT * FROM experts WHERE user_id = ?', [req.user.user_id]);
    if (expertRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }
    const expert = expertRows[0];

    // Get services
    const services = await query(
      `SELECT es.service_id, es.price, es.unit, s.service_name, s.category, s.description 
       FROM expert_services es 
       JOIN services s ON es.service_id = s.service_id 
       WHERE es.expert_id = ?`,
      [expert.expert_id]
    );

    // Get areas
    const areas = await query(
      `SELECT ea.area_id, a.area_name 
       FROM expert_areas ea 
       JOIN areas a ON ea.area_id = a.area_id 
       WHERE ea.expert_id = ?`,
      [expert.expert_id]
    );

    // Get languages
    const languages = await query(
      `SELECT el.language_id, l.name as language_name 
       FROM expert_languages el 
       JOIN languages l ON el.language_id = l.language_id 
       WHERE el.expert_id = ?`,
      [expert.expert_id]
    );

    // Get weekly availability slots
    const slots = await query(
      'SELECT slot_id, weekday, time_slot FROM availability_slots WHERE expert_id = ? ORDER BY FIELD(weekday, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")',
      [expert.expert_id]
    );

    // Get latest verification history
    const verifications = await query(
      'SELECT * FROM verifications WHERE expert_id = ? ORDER BY created_at DESC',
      [expert.expert_id]
    );

    const trustInfo = calculateTrust(expert);

    return res.json({
      success: true,
      expert: {
        ...expert,
        trust: trustInfo,
        services,
        areas,
        languages,
        slots,
        verifications
      }
    });
  } catch (err) {
    console.error('[GET MY EXPERT PROFILE ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
}

// Update expert profile details
async function updateMyExpertProfile(req, res) {
  try {
    const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [req.user.user_id]);
    if (expertRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expert profile not found.' });
    }
    const expertId = expertRows[0].expert_id;

    const { occupation, intro, years_in_city, services, areas, languages, photo_url } = req.body;

    await execute(
      'UPDATE experts SET occupation = ?, intro = ?, years_in_city = ?, photo_url = COALESCE(?, photo_url) WHERE expert_id = ?',
      [occupation || 'Local Expert', intro || '', Number(years_in_city) || 1, photo_url || null, expertId]
    );

    if (services && Array.isArray(services)) {
      await execute('DELETE FROM expert_services WHERE expert_id = ?', [expertId]);
      for (const s of services) {
        if (s.service_id) {
          await execute(
            'INSERT INTO expert_services (expert_id, service_id, price, unit) VALUES (?, ?, ?, ?)',
            [expertId, s.service_id, s.price || 400.00, s.unit || 'per_hour']
          );
        }
      }
    }

    if (areas && Array.isArray(areas)) {
      await execute('DELETE FROM expert_areas WHERE expert_id = ?', [expertId]);
      for (const aId of areas) {
        await execute('INSERT INTO expert_areas (expert_id, area_id) VALUES (?, ?)', [expertId, aId]);
      }
    }

    if (languages && Array.isArray(languages)) {
      await execute('DELETE FROM expert_languages WHERE expert_id = ?', [expertId]);
      for (const lId of languages) {
        await execute('INSERT INTO expert_languages (expert_id, language_id) VALUES (?, ?)', [expertId, lId]);
      }
    }

    return res.json({
      success: true,
      message: 'Expert profile updated successfully.'
    });
  } catch (err) {
    console.error('[UPDATE EXPERT PROFILE ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// Update weekly availability slots (Module M3)
async function updateAvailability(req, res) {
  try {
    const expertRows = await query('SELECT expert_id FROM experts WHERE user_id = ?', [req.user.user_id]);
    if (expertRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expert profile not found.' });
    }
    const expertId = expertRows[0].expert_id;

    const { slots } = req.body; // Array of { weekday: 'Saturday', time_slot: 'morning' }
    if (!Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Slots must be an array of { weekday, time_slot } objects.' });
    }

    // Replace all slots
    await execute('DELETE FROM availability_slots WHERE expert_id = ?', [expertId]);

    for (const slot of slots) {
      if (slot.weekday && slot.time_slot) {
        await execute(
          'INSERT IGNORE INTO availability_slots (expert_id, weekday, time_slot) VALUES (?, ?, ?)',
          [expertId, slot.weekday, slot.time_slot]
        );
      }
    }

    const updatedSlots = await query('SELECT slot_id, weekday, time_slot FROM availability_slots WHERE expert_id = ?', [expertId]);

    return res.json({
      success: true,
      message: 'Weekly availability updated successfully.',
      slots: updatedSlots
    });
  } catch (err) {
    console.error('[UPDATE AVAILABILITY ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update availability.' });
  }
}

// Get public expert profile (Module M3)
async function getExpertById(req, res) {
  try {
    const expertId = Number(req.params.id);

    const expertRows = await query(
      `SELECT e.*, u.name, u.phone, u.status as user_status 
       FROM experts e 
       JOIN users u ON e.user_id = u.user_id 
       WHERE e.expert_id = ?`,
      [expertId]
    );

    if (expertRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expert not found.' });
    }

    const expert = expertRows[0];

    // Public view only shows verified and unsuspended
    if (expert.verification_status !== 'verified' || expert.user_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This expert profile is not active or verified for public booking.'
      });
    }

    // Fetch services
    const services = await query(
      `SELECT es.service_id, es.price, es.unit, s.service_name, s.category, s.description 
       FROM expert_services es 
       JOIN services s ON es.service_id = s.service_id 
       WHERE es.expert_id = ?`,
      [expertId]
    );

    // Fetch areas
    const areas = await query(
      `SELECT ea.area_id, a.area_name 
       FROM expert_areas ea 
       JOIN areas a ON ea.area_id = a.area_id 
       WHERE ea.expert_id = ?`,
      [expertId]
    );

    // Fetch languages
    const languages = await query(
      `SELECT el.language_id, l.name as language_name 
       FROM expert_languages el 
       JOIN languages l ON el.language_id = l.language_id 
       WHERE el.expert_id = ?`,
      [expertId]
    );

    // Fetch availability slots
    const slots = await query(
      'SELECT slot_id, weekday, time_slot FROM availability_slots WHERE expert_id = ?',
      [expertId]
    );

    // Calculate smoothed trust rating
    const trust = calculateTrust(expert);

    return res.json({
      success: true,
      expert: {
        expert_id: expert.expert_id,
        user_id: expert.user_id,
        name: expert.name,
        photo_url: expert.photo_url,
        occupation: expert.occupation,
        intro: expert.intro,
        years_in_city: expert.years_in_city,
        verification_status: expert.verification_status,
        rating_sum: expert.rating_sum,
        rating_count: expert.rating_count,
        smoothed_rating: trust.smoothedRating,
        trust_score: trust.trustScore,
        services,
        areas,
        languages,
        slots
      }
    });
  } catch (err) {
    console.error('[GET EXPERT BY ID ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch expert profile.' });
  }
}

// Get verified reviews for an expert (Module M7)
async function getExpertReviews(req, res) {
  try {
    const expertId = Number(req.params.id);

    const reviews = await query(
      `SELECT r.review_id, r.booking_id, r.rating, r.comment, r.created_at, 
              u.name as reviewer_name, s.service_name
       FROM reviews r 
       JOIN users u ON r.user_id = u.user_id
       JOIN bookings b ON r.booking_id = b.booking_id
       JOIN services s ON b.service_id = s.service_id
       WHERE r.expert_id = ? AND r.is_hidden = FALSE 
       ORDER BY r.created_at DESC`,
      [expertId]
    );

    return res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    console.error('[GET EXPERT REVIEWS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
}

module.exports = {
  applyForVerification,
  getMyExpertProfile,
  updateMyExpertProfile,
  updateAvailability,
  getExpertById,
  getExpertReviews
};
