const Stripe = require('stripe');
const config = require('../config');

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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount * 100, // Convert to cents
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
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  cancelPaymentIntent
};