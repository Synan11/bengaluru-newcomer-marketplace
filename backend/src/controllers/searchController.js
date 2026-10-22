const { query } = require('../db/pool');
const { rankExperts, DEFAULT_M, DEFAULT_C } = require('../services/ranking');

async function searchExperts(req, res) {
  try {
    const { needs, area, language, day, slot, strict, category } = req.query;

    // Parse parameters
    const parsedNeeds = needs 
      ? needs.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)) 
      : [];
    const areaId = area ? Number(area) : null;
    const languageIds = language 
      ? language.split(',').map(s => Number(s.trim())).filter(l => !isNaN(l)) 
      : [];
    const requestedSlot = (day && slot) ? `${day}_${slot}` : null;
    const isStrict = strict === 'true' || strict === '1';

    // Fetch area name if areaId is passed
    let areaName = null;
    if (areaId) {
      const areaRows = await query('SELECT area_name FROM areas WHERE area_id = ?', [areaId]);
      if (areaRows.length > 0) areaName = areaRows[0].area_name;
    }

    // Step 1: SQL Hard Filter
    // Only verified experts belonging to active users
    let sql = `
      SELECT e.expert_id, e.user_id, e.photo_url, e.occupation, e.intro, 
             e.years_in_city, e.rating_sum, e.rating_count,
             u.name, u.email, u.phone
      FROM experts e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.verification_status = 'verified' 
        AND u.status = 'active'
    `;
    const params = [];

    // If category is provided, expert must offer at least one service in that category
    if (category) {
      sql += ` AND e.expert_id IN (
        SELECT es.expert_id FROM expert_services es
        JOIN services s ON es.service_id = s.service_id
        WHERE s.category = ?
      )`;
      params.push(category);
    }

    const expertRows = await query(sql, params);

    if (expertRows.length === 0) {
      return res.json({
        success: true,
        count: 0,
        platformAverage: DEFAULT_M,
        results: [],
        message: 'No verified experts currently match the baseline criteria.'
      });
    }

    const expertIds = expertRows.map(e => e.expert_id);

    // Fetch services for all candidates
    const servicesRows = await query(
      `SELECT es.expert_id, es.service_id, es.price, es.unit, s.service_name, s.category 
       FROM expert_services es 
       JOIN services s ON es.service_id = s.service_id 
       WHERE es.expert_id IN (${expertIds.join(',')})`
    );

    // Fetch areas for all candidates
    const areasRows = await query(
      `SELECT ea.expert_id, ea.area_id, a.area_name 
       FROM expert_areas ea 
       JOIN areas a ON ea.area_id = a.area_id 
       WHERE ea.expert_id IN (${expertIds.join(',')})`
    );

    // Fetch languages for all candidates
    const languagesRows = await query(
      `SELECT el.expert_id, el.language_id, l.name as language_name 
       FROM expert_languages el 
       JOIN languages l ON el.language_id = l.language_id 
       WHERE el.expert_id IN (${expertIds.join(',')})`
    );

    // Fetch availability slots for all candidates
    const slotsRows = await query(
      `SELECT expert_id, weekday, time_slot 
       FROM availability_slots 
       WHERE expert_id IN (${expertIds.join(',')})`
    );

    // Compute dynamic platform average m
    const avgRows = await query(
      `SELECT AVG(rating_sum / rating_count) as avg_rating 
       FROM experts 
       WHERE verification_status = 'verified' AND rating_count > 0`
    );
    const platformAverage = (avgRows.length > 0 && avgRows[0].avg_rating)
      ? Number(Number(avgRows[0].avg_rating).toFixed(2))
      : DEFAULT_M;

    // Assemble experts with relational sets
    const candidates = expertRows.map(e => {
      const eServices = servicesRows.filter(s => s.expert_id === e.expert_id);
      const eAreas = areasRows.filter(a => a.expert_id === e.expert_id);
      const eLanguages = languagesRows.filter(l => l.expert_id === e.expert_id);
      const eSlots = slotsRows.filter(s => s.expert_id === e.expert_id);

      const minPrice = eServices.length > 0 
        ? Math.min(...eServices.map(s => Number(s.price))) 
        : 400;

      return {
        ...e,
        services: eServices.map(s => s.service_id),
        servicesDetails: eServices,
        areas: eAreas.map(a => a.area_id),
        areasDetails: eAreas.map(a => a.area_name),
        languages: eLanguages.map(l => l.language_id),
        languagesDetails: eLanguages.map(l => l.language_name),
        freeSlots: eSlots.map(s => `${s.weekday}_${s.time_slot}`),
        slotsDetails: eSlots,
        startingPrice: minPrice,
        ratingSum: Number(e.rating_sum),
        ratingCount: Number(e.rating_count)
      };
    });

    const searchRequest = {
      needs: parsedNeeds,
      areaId: areaId,
      areaName: areaName,
      languages: languageIds,
      slot: requestedSlot,
      strict: isStrict
    };

    // Step 2 & 3: Run ranking algorithm (coverage + area + smoothed trust + language + availability)
    const rankedExperts = rankExperts(candidates, searchRequest, {
      platformAverage,
      C: DEFAULT_C
    });

    return res.json({
      success: true,
      count: rankedExperts.length,
      platformAverage,
      searchCriteria: {
        needs: parsedNeeds,
        areaId,
        areaName,
        languages: languageIds,
        slot: requestedSlot,
        strict: isStrict
      },
      results: rankedExperts
    });
  } catch (err) {
    console.error('[SEARCH EXPERTS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Search execution failed: ' + err.message });
  }
}

module.exports = {
  searchExperts
};
