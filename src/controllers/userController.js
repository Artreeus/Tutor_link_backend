const asyncHandler = require('../utils/asyncHandler');
const { User, UserRole } = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User not found with id of ${req.params.id}`
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User not found with id of ${req.params.id}`
    });
  }

  // Make sure user is the owner or an admin
  if (req.user._id.toString() !== req.params.id && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: `User ${req.user._id} is not authorized to update this user`
    });
  }

  // Don't allow role changes except for admin
  if (req.body.role && req.user.role !== UserRole.ADMIN) {
    delete req.body.role;
  }

  // Don't update password through this route
  if (req.body.password) {
    delete req.body.password;
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User not found with id of ${req.params.id}`
    });
  }

  // Make sure user is the owner or an admin
  if (req.user._id.toString() !== req.params.id && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: `User ${req.user._id} is not authorized to delete this user`
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all tutors
// @route   GET /api/users/tutors
// @access  Public
const getTutors = asyncHandler(async (req, res) => {
  const { subject, rating, price, name } = req.query;
  
  // Build query
  let query = { role: UserRole.TUTOR };
  
  // Filter by subject
  if (subject) {
    query.subjects = subject;
  }
  
  // Filter by rating
  if (rating) {
    query.averageRating = { $gte: parseFloat(rating) };
  }
  
  // Filter by price
  if (price) {
    const [min, max] = price.split('-');
    query.hourlyRate = {};
    
    if (min) query.hourlyRate.$gte = parseFloat(min);
    if (max) query.hourlyRate.$lte = parseFloat(max);
  }
  
  // Filter by name
  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }
  
  const tutors = await User.find(query).populate('subjects');

  res.status(200).json({
    success: true,
    count: tutors.length,
    data: tutors
  });
});

// @desc    Update tutor profile
// @route   PUT /api/users/tutor-profile
// @access  Private/Tutor
const updateTutorProfile = asyncHandler(async (req, res) => {
  // Ensure user is a tutor
  if (req.user.role !== UserRole.TUTOR) {
    return res.status(403).json({
      success: false,
      message: 'Only tutors can update tutor profiles'
    });
  }

  const { bio, subjects, availability, hourlyRate } = req.body;
  
  const updateData = {};
  
  if (bio) updateData.bio = bio;
  if (subjects) updateData.subjects = subjects;
  if (availability) updateData.availability = availability;
  if (hourlyRate) updateData.hourlyRate = hourlyRate;
  
  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getTutors,
  updateTutorProfile
};