const express = require('express');
const { body } = require('express-validator');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  createPayment,
  confirmPayment,
  getTutorAvailability
} = require('../controllers/bookingController');
const { protect, authorize, UserRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { BookingStatus } = require('../models/Booking');

const router = express.Router();

// Get tutor availability - public route
router.get('/availability/:tutorId', getTutorAvailability);

// All other booking routes are protected
router.use(protect);

router.route('/')
  .get(getBookings)
  .post(
    authorize(UserRole.STUDENT),
    validate([
      body('tutor').notEmpty().withMessage('Tutor is required'),
      body('subject').notEmpty().withMessage('Subject is required'),
      body('date').isISO8601().toDate().withMessage('Date must be a valid date'),
      body('startTime').notEmpty().withMessage('Start time is required'),
      body('endTime').notEmpty().withMessage('End time is required'),
      body('duration').isNumeric().withMessage('Duration must be a number')
    ]),
    createBooking
  );

router.route('/:id')
  .get(getBooking)
  .put(
    validate([
      body('status')
        .optional()
        .isIn(Object.values(BookingStatus))
        .withMessage('Invalid status')
    ]),
    updateBooking
  )
  .delete(authorize(UserRole.ADMIN), deleteBooking);

// Payment routes
router.post(
  '/:id/payment',
  authorize(UserRole.STUDENT),
  createPayment
);

router.put(
  '/:id/confirm-payment',
  authorize(UserRole.STUDENT),
  confirmPayment
);

router.put(
  '/:id/pay',
  authorize(UserRole.STUDENT),
  processDirectPayment
);

module.exports = router;