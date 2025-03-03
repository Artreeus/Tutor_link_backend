const asyncHandler = require('../utils/asyncHandler');
const { Booking, BookingStatus } = require('../models/Booking');
const { User, UserRole } = require('../models/User');
const PaymentService = require('../services/paymentService');
const EmailService = require('../services/emailService');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
  let query = {};
  
  // If user is student, get only their bookings
  if (req.user.role === UserRole.STUDENT) {
    query = { student: req.user._id };
  }
  
  // If user is tutor, get only their bookings
  if (req.user.role === UserRole.TUTOR) {
    query = { tutor: req.user._id };
  }
  
  const bookings = await Booking.find(query)
    .populate('student', 'name email')
    .populate('tutor', 'name email')
    .populate('subject', 'name gradeLevel');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('student', 'name email')
    .populate('tutor', 'name email')
    .populate('subject', 'name gradeLevel');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `Booking not found with id of ${req.params.id}`
    });
  }

  // Make sure user is booking owner (student), the tutor, or an admin
  if (
    booking.student._id.toString() !== req.user._id.toString() &&
    booking.tutor._id.toString() !== req.user._id.toString() &&
    req.user.role !== UserRole.ADMIN
  ) {
    return res.status(403).json({
      success: false,
      message: `User ${req.user._id} is not authorized to access this booking`
    });
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private/Student
const createBooking = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== UserRole.STUDENT) {
    return res.status(403).json({
      success: false,
      message: 'Only students can create bookings'
    });
  }

  // Add student to request body
  req.body.student = req.user._id;
  
  // Find tutor to get hourly rate
  const tutor = await User.findById(req.body.tutor);
  
  if (!tutor) {
    return res.status(404).json({
      success: false,
      message: 'Tutor not found'
    });
  }
  
  if (tutor.role !== UserRole.TUTOR) {
    return res.status(400).json({
      success: false,
      message: 'Selected user is not a tutor'
    });
  }
  
  // Calculate price based on duration and hourly rate
  const duration = parseFloat(req.body.duration);
  const hourlyRate = tutor.hourlyRate || 0;
  
  req.body.price = duration * hourlyRate;
  
  const booking = await Booking.create(req.body);

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = asyncHandler(async (req, res) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `Booking not found with id of ${req.params.id}`
    });
  }

  // Only the tutor can update a booking to confirm it
  if (req.body.status === BookingStatus.CONFIRMED) {
    if (booking.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the tutor can confirm a booking'
      });
    }
  }
  
  // Only the student can update a booking to cancel it
  if (req.body.status === BookingStatus.CANCELLED) {
    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the student can cancel a booking'
      });
    }
    
    // If there's a payment intent, cancel it
    if (booking.paymentIntentId) {
      await PaymentService.cancelPaymentIntent(booking.paymentIntentId);
    }
  }
  
  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
const deleteBooking = asyncHandler(async (req, res) => {
  // Only admin can delete bookings permanently
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admin can delete bookings'
    });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `Booking not found with id of ${req.params.id}`
    });
  }

  await booking.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Create payment intent for booking
// @route   POST /api/bookings/:id/payment
// @access  Private/Student
const createPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `Booking not found with id of ${req.params.id}`
    });
  }

  // Make sure user is the student who booked
  if (booking.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to make payment for this booking'
    });
  }

  // Check if booking is already paid
  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'This booking is already paid'
    });
  }

  // Create payment intent
  const paymentIntent = await PaymentService.createPaymentIntent({
    amount: booking.price,
    currency: 'usd',
    metadata: {
      bookingId: booking._id.toString(),
      studentId: booking.student.toString(),
      tutorId: booking.tutor.toString()
    }
  });

  if (!paymentIntent.success) {
    return res.status(400).json({
      success: false,
      message: paymentIntent.message
    });
  }

  // Update booking with payment intent ID
  booking.paymentIntentId = paymentIntent.paymentIntentId;
  await booking.save();

  res.status(200).json({
    success: true,
    clientSecret: paymentIntent.clientSecret
  });
});

// @desc    Confirm payment for booking
// @route   PUT /api/bookings/:id/confirm-payment
// @access  Private/Student
const confirmPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `Booking not found with id of ${req.params.id}`
    });
  }

  // Make sure user is the student who booked
  if (booking.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to confirm payment for this booking'
    });
  }

  // Check if payment intent exists
  if (!booking.paymentIntentId) {
    return res.status(400).json({
      success: false,
      message: 'No payment intent found for this booking'
    });
  }

  // Verify payment intent status
  const paymentIntent = await PaymentService.retrievePaymentIntent(booking.paymentIntentId);
  
  if (!paymentIntent.success) {
    return res.status(400).json({
      success: false,
      message: paymentIntent.message
    });
  }

  // Check if payment is successful
  if (paymentIntent.paymentIntent.status === 'succeeded') {
    // Update booking status
    booking.paymentStatus = 'paid';
    booking.status = BookingStatus.CONFIRMED;
    await booking.save();
    
    // Get student details for email
    const student = await User.findById(booking.student);
    const tutor = await User.findById(booking.tutor);
    
    if (student && tutor) {
      // Send payment confirmation email
      await EmailService.sendPaymentConfirmation(
        student.email,
        student.name,
        {
          amount: booking.price,
          bookingId: booking._id.toString()
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: booking
    });
  }

  res.status(400).json({
    success: false,
    message: `Payment not successful. Status: ${paymentIntent.paymentIntent.status}`
  });
});

module.exports = {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  createPayment,
  confirmPayment
};