const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getTutors,
  updateTutorProfile
} = require('../controllers/userController');
const { protect, authorize, UserRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Public routes
router.get('/tutors', getTutors);

// Protected routes
router.use(protect);

// Admin routes
router.route('/')
  .get(authorize(UserRole.ADMIN), getUsers)
  .post(
    authorize(UserRole.ADMIN),
    validate([
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('email').isEmail().withMessage('Please include a valid email'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
      body('role').isIn(Object.values(UserRole)).withMessage('Invalid role')
    ]),
    createUser
  );

// General user routes
router.route('/:id')
  .get(getUser)
  .put(
    validate([
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('email').optional().isEmail().withMessage('Please include a valid email')
    ]),
    updateUser
  )
  .delete(deleteUser);

// Tutor profile routes
router.put(
  '/tutor-profile',
  authorize(UserRole.TUTOR),
  validate([
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
    body('hourlyRate').optional().isNumeric().withMessage('Hourly rate must be a number')
  ]),
  updateTutorProfile
);

module.exports = router;