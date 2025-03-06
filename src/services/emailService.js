const nodemailer = require('nodemailer');
const config = require('../config');

// Create reusable transporter
let transporter;

// Initialize based on environment
if (config.nodeEnv === 'production') {
  // Production setup (e.g., SendGrid, Mailgun, etc.)
  transporter = nodemailer.createTransport({
    service: 'SendGrid', // or another provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development setup with ethereal.email
  nodemailer.createTestAccount().then(testAccount => {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  });
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email text content
 * @param {string} [options.html] - Email HTML content
 * @returns {Promise<Object>} - Success indicator and message ID
 */
async function sendEmail(options) {
  try {
    const info = await transporter.sendMail({
      from: `"TutorLink" <${process.env.EMAIL_FROM || 'noreply@tutorlink.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    });

    if (config.nodeEnv !== 'production') {
      console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send booking confirmation email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {Object} bookingDetails - Booking details
 * @returns {Promise<Object>} - Success indicator
 */
const sendBookingConfirmation = async (email, name, bookingDetails) => {
  const subject = "Booking Confirmation - TutorLink";
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Hello ${name},</p>
    <p>Your booking with <strong>${bookingDetails.tutorName}</strong> for <strong>${bookingDetails.subject}</strong> 
    has been confirmed for <strong>${bookingDetails.date}</strong> from <strong>${bookingDetails.startTime}</strong> 
    to <strong>${bookingDetails.endTime}</strong>.</p>
    <p>Thank you for using TutorLink!</p>
    <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
  `;

  return await sendEmail({
    to: email,
    subject,
    text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    html
  });
};

/**
 * Send payment confirmation email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} - Success indicator
 */
const sendPaymentConfirmation = async (email, name, paymentDetails) => {
  const subject = "Payment Confirmation - TutorLink";
  const html = `
    <h2>Payment Confirmation</h2>
    <p>Hello ${name},</p>
    <p>Your payment of <strong>$${paymentDetails.amount.toFixed(2)}</strong> for booking ID <strong>${paymentDetails.bookingId}</strong> 
    has been confirmed.</p>
    <p>Thank you for using TutorLink!</p>
    <p>You can view your booking details in your dashboard.</p>
  `;

  return await sendEmail({
    to: email,
    subject,
    text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    html
  });
};

/**
 * Send new booking notification to tutor
 * @param {string} email - Tutor's email
 * @param {string} name - Tutor's name
 * @param {Object} bookingDetails - Booking details
 * @returns {Promise<Object>} - Success indicator
 */
const sendNewBookingNotification = async (email, name, bookingDetails) => {
  const subject = "New Booking Request - TutorLink";
  const html = `
    <h2>New Booking Request</h2>
    <p>Hello ${name},</p>
    <p>You have received a new booking request from <strong>${bookingDetails.studentName}</strong> for <strong>${bookingDetails.subject}</strong> 
    on <strong>${bookingDetails.date}</strong> from <strong>${bookingDetails.startTime}</strong> 
    to <strong>${bookingDetails.endTime}</strong>.</p>
    <p>Please log in to your tutor dashboard to accept or decline this request.</p>
  `;

  return await sendEmail({
    to: email,
    subject,
    text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    html
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendNewBookingNotification
};