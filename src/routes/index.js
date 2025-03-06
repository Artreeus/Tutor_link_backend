const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const subjectRoutes = require('./subjectRoutes');
const bookingRoutes = require('./bookingRoutes');
const reviewRoutes = require('./reviewRoutes');
const calendarRoutes = require('./calendarRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/calendar', calendarRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    version: '1.0.0'
  });
});

module.exports = router;