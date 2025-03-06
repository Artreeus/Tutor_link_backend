const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { UserRole } = require('../models/User');
const { User } = require('../models/User');
const calendarService = require('../services/calendarService');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get auth URL
router.get('/auth-url', (req, res) => {
  const authUrl = calendarService.getAuthUrl();
  res.status(200).json({
    success: true,
    authUrl
  });
});

// Handle callback from Google
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const userId = req.user._id;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required'
    });
  }
  
  const success = await calendarService.handleCallback(code.toString(), userId);
  
  if (success) {
    res.status(200).json({
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Failed to connect Google Calendar'
    });
  }
});

// Sync tutor availability with Google Calendar
router.post('/sync-availability', authorize(UserRole.TUTOR), async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.googleCalendarTokens) {
    return res.status(400).json({
      success: false,
      message: 'Google Calendar not connected'
    });
  }
  
  const success = await calendarService.syncAvailability(
    user.googleCalendarTokens,
    user.availability
  );
  
  if (success) {
    res.status(200).json({
      success: true,
      message: 'Availability synced successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Failed to sync availability'
    });
  }
});

// Disconnect Google Calendar
router.delete('/disconnect', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { googleCalendarTokens: 1 }
    });
    
    res.status(200).json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Calendar'
    });
  }
});

module.exports = router;