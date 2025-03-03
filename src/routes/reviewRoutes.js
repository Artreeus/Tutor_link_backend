const express = require('express');
const { body } = require('express-validator');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getTutorReviews
} = require('../controllers/reviewController');
const { protect, authorize, UserRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/:id', getReview);

// Tutor reviews
router.get('/tutor/:id', getTutorReviews);

// Protected routes
router.use(protect);

router.post(
  '/',
  authorize(UserRole.STUDENT),
  validate([
    body('booking').notEmpty().withMessage('Booking is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required')
  ]),
  createReview
);

router.put(
  '/:id',
  validate([
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().notEmpty().withMessage('Comment cannot be empty')
  ]),
  updateReview
);

router.delete('/:id', deleteReview);

module.exports = router;