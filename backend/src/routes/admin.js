const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All admin routes require authenticated admin
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/experts', adminController.getAdminExperts);
router.patch('/experts/:id', adminController.updateExpertStatus);
router.get('/reports', adminController.getAdminReports);
router.patch('/reports/:id', adminController.updateReportStatus);
router.get('/bookings', adminController.getAdminBookings);
router.get('/users', adminController.getAdminUsers);
router.patch('/reviews/:id/hide', adminController.toggleHideReview);
router.get('/id-docs/:filename', adminController.getProtectedIdDoc);
router.get('/sensitivity-test', adminController.runSensitivityTest);

module.exports = router;
