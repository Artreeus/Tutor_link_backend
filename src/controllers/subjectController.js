const asyncHandler = require('../utils/asyncHandler');
const Subject = require('../models/Subject');
const { UserRole } = require('../models/User');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
const getSubjects = asyncHandler(async (req, res) => {
  const { category, gradeLevel } = req.query;
  
  // Build query
  let query = {};
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Filter by grade level
  if (gradeLevel) {
    query.gradeLevel = gradeLevel;
  }
  
  const subjects = await Subject.find(query);

  res.status(200).json({
    success: true,
    count: subjects.length,
    data: subjects
  });
});

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Public
const getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: `Subject not found with id of ${req.params.id}`
    });
  }

  res.status(200).json({
    success: true,
    data: subject
  });
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = asyncHandler(async (req, res) => {
  // Ensure user is an admin
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admin can add subjects'
    });
  }

  const subject = await Subject.create(req.body);

  res.status(201).json({
    success: true,
    data: subject
  });
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = asyncHandler(async (req, res) => {
  // Ensure user is an admin
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admin can update subjects'
    });
  }

  let subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: `Subject not found with id of ${req.params.id}`
    });
  }

  subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: subject
  });
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = asyncHandler(async (req, res) => {
  // Ensure user is an admin
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admin can delete subjects'
    });
  }

  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: `Subject not found with id of ${req.params.id}`
    });
  }

  await subject.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
};