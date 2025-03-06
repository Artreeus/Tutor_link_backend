const Stripe = require('stripe');
const config = require('../config');
const { Booking, BookingStatus } = require('../models/Booking');
const { User } = require('../models/User');
const emailService = require('./emailService');

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent
 * @param {Object} params - Payment intent parameters
 * @param {number} params.amount - Amount to charge
 * @param {string} params.currency - Currency code
 * @param {Object} params.metadata - Metadata for the payment
 * @returns {Object} - Payment intent data or error
 */
const createPaymentIntent = async (params) => {
  try {
    // Ensure minimum amount of 50 cents
    const amount = Math.max(params.amount, 0.5) * 100; // Convert to cents
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Round to ensure integer
      currency: params.currency,
      metadata: params.metadata,
      payment_method_types: ['card'],
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Object} - Payment intent data or error
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent
    };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Cancel a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Object} - Payment intent data or error
 */
const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return {
      success: true,
      paymentIntent
    };
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Process booking payment and update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Object} - Success indicator and updated booking
 */
const processBookingPayment = async (bookingId, paymentIntentId) => {
  try {
    // Get payment intent details
    const { success, paymentIntent } = await retrievePaymentIntent(paymentIntentId);
    
    if (!success) {
      return { success: false, message: 'Payment intent not found' };
    }
    
    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return { 
        success: false, 
        message: `Payment not completed. Status: ${paymentIntent.status}` 
      };
    }
    
    // Update booking
    const booking = await Booking.findById(bookingId)
      .populate('student', 'name email')
      .populate('tutor', 'name email')
      .populate('subject', 'name');
    
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }
    
    booking.paymentStatus = 'paid';
    booking.status = BookingStatus.CONFIRMED;
    await booking.save();
    
    // Send confirmation emails
    await emailService.sendPaymentConfirmation(
      booking.student.email,
      booking.student.name,
      {
        amount: booking.price,
        bookingId: booking._id.toString()
      }
    );
    
    await emailService.sendBookingConfirmation(
      booking.student.email,
      booking.student.name,
      {
        tutorName: booking.tutor.name,
        subject: booking.subject.name,
        date: new Date(booking.date).toLocaleDateString(),
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    );
    
    await emailService.sendNewBookingNotification(
      booking.tutor.email,
      booking.tutor.name,
      {
        studentName: booking.student.name,
        subject: booking.subject.name,
        date: new Date(booking.date).toLocaleDateString(),
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    );
    
    return {
      success: true,
      booking
    };
  } catch (error) {
    console.error('Error processing booking payment:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Create a refund for a payment
 * @param {string} paymentIntentId - Payment intent ID to refund
 * @param {number} amount - Amount to refund (in dollars)
 * @param {string} reason - Reason for refund
 * @returns {Object} - Success indicator and refund data
 */
const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundParams = {
      payment_intent: paymentIntentId,
      reason: reason
    };
    
    // If amount is specified, convert to cents and add to params
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }
    
    const refund = await stripe.refunds.create(refundParams);
    
    return {
      success: true,
      refund
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Calculate tutor earnings (after platform fee)
 * @param {number} bookingAmount - Total booking amount
 * @returns {number} - Tutor earnings
 */
const calculateTutorEarnings = (bookingAmount) => {
  // Platform takes 15% commission
  const platformFeePercentage = 0.15;
  const platformFee = bookingAmount * platformFeePercentage;
  const tutorEarnings = bookingAmount - platformFee;
  
  return parseFloat(tutorEarnings.toFixed(2));
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  cancelPaymentIntent,
  processBookingPayment,
  createRefund,
  calculateTutorEarnings
};