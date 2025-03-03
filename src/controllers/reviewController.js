const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');
const { Booking } = require('../models/Booking');
const { UserRole } = require('../models/User');
const { BookingStatus } = require('../models/Booking');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const { tutor } = req.query;
  
  // Build query
  let query = {};
  
  if (tutor) {
    query.tutor = tutor;
  }
  
  const reviews = await Review.find(query)
    .populate('student', 'name')
    .populate('tutor', 'name')
    .populate('booking', 'date subject');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Student or Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: `Review not found with id of ${req.params.id}`
    });
  }

  // Make sure review belongs to student or user is admin
  if (review.student.toString() !== req.user._id.toString() && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get reviews for a tutor
// @route   GET /api/tutors/:id/reviews
// @access  Public
const getTutorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ tutor: req.params.id })
    .populate('student', 'name')
    .populate('booking', 'date subject');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

module.exports = {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getTutorReviews
};
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('student', 'name')
    .populate('tutor', 'name')
    .populate('booking', 'date subject');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: `Review not found with id of ${req.params.id}`
    });
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private/Student
const createReview = asyncHandler(async (req, res) => {
  // Add student to request body
  req.body.student = req.user._id;
  
  // Ensure user is a student
  if (req.user.role !== UserRole.STUDENT) {
    return res.status(403).json({
      success: false,
      message: 'Only students can create reviews'
    });
  }
  
  // Check if booking exists and is completed
  const booking = await Booking.findById(req.body.booking);
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  // Make sure student is the one who booked
  if (booking.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only review bookings you made'
    });
  }
  
  // Make sure booking is completed
  if (booking.status !== BookingStatus.COMPLETED) {
    return res.status(400).json({
      success: false,
      message: 'You can only review completed bookings'
    });
  }
  
  // Check if student already reviewed this booking
  const existingReview = await Review.findOne({
    student: req.user._id,
    booking: booking._id
  });
  
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this booking'
    });
  }
  
  // Add tutor to request body
  req.body.tutor = booking.tutor;
  
  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private/Student
const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: `Review not found with id of ${req.params.id}`
    });
  }

  // Make sure review belongs to student
  if (review.student.toString() !== req.user._id.toString() && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  // Don't allow changing student or tutor
  delete req.body.student;
  delete req.body.tutor;
  delete req.body.booking;

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});