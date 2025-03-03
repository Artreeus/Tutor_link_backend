const express = require('express');
const { body } = require('express-validator');
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect, authorize, UserRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Public routes
router.get('/', getSubjects);
router.get('/:id', getSubject);

// Protected routes
router.use(protect);

// Admin routes
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('gradeLevel').trim().notEmpty().withMessage('Grade level is required'),
    body('category').trim().notEmpty().withMessage('Category is required')
  ]),
  createSubject
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('gradeLevel').optional().trim().notEmpty().withMessage('Grade level cannot be empty'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty')
  ]),
  updateSubject
);

router.delete('/:id', authorize(UserRole.ADMIN), deleteSubject);

module.exports = router;