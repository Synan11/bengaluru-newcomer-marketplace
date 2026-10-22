const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/referenceController');

router.get('/services', referenceController.getServices);
router.get('/areas', referenceController.getAreas);
router.get('/languages', referenceController.getLanguages);

module.exports = router;
