const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./src/db/pool');

// Route imports
const authRoutes = require('./src/routes/auth');
const referenceRoutes = require('./src/routes/reference');
const expertRoutes = require('./src/routes/experts');
const searchRoutes = require('./src/routes/search');
const bookingRoutes = require('./src/routes/bookings');
const reviewRoutes = require('./src/routes/reviews');
const reportRoutes = require('./src/routes/reports');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (allow admin web and mobile app requests)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve profile photos statically
// NOTE: ID documents are NOT statically exposed; they are accessed only via admin-authenticated endpoint.
app.use('/uploads/photos', express.static(path.join(__dirname, 'uploads', 'photos')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Verified Local Assistance Marketplace API (Bengaluru MVP)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', referenceRoutes); // /api/services, /api/areas, /api/languages
app.use('/api/experts/search', searchRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`\n============================================================`);
  console.log(` Bengaluru Newcomer Marketplace API is running on port ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`============================================================\n`);
  await testConnection();
});

module.exports = app;
