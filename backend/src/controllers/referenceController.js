const { query } = require('../db/pool');

async function getServices(req, res) {
  try {
    const services = await query('SELECT * FROM services ORDER BY category, service_name');
    return res.json({
      success: true,
      services
    });
  } catch (err) {
    console.error('[SERVICES ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
}

async function getAreas(req, res) {
  try {
    const areas = await query('SELECT * FROM areas ORDER BY area_name ASC');
    return res.json({
      success: true,
      areas
    });
  } catch (err) {
    console.error('[AREAS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch areas.' });
  }
}

async function getLanguages(req, res) {
  try {
    const languages = await query('SELECT * FROM languages ORDER BY name ASC');
    return res.json({
      success: true,
      languages
    });
  } catch (err) {
    console.error('[LANGUAGES ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch languages.' });
  }
}

module.exports = {
  getServices,
  getAreas,
  getLanguages
};
