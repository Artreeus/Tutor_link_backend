const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models/User');

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get Google Calendar service
const calendar = google.calendar({ version: 'v3' });

/**
 * Generate Google OAuth URL for user authorization
 * @returns {string} OAuth URL
 */
const getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force to get refresh token
  });
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @param {string} userId - User ID to store tokens
 * @returns {Promise<boolean>} Success indicator
 */
const handleCallback = async (code, userId) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in database for the user
    await User.findByIdAndUpdate(userId, {
      googleCalendarTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return false;
  }
};

/**
 * Set tokens for a user
 * @param {Object} tokens - Google OAuth tokens
 */
const setTokens = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

/**
 * Create a calendar event for a booking
 * @param {Object} userTokens - User's Google OAuth tokens
 * @param {Object} bookingData - Booking details
 * @returns {Promise<string|null>} Event ID if successful, null otherwise
 */
const createCalendarEvent = async (userTokens, bookingData) => {
  try {
    setTokens(userTokens);
    
    const event = {
      summary: `TutorLink: ${bookingData.subject.name} Tutoring Session`,
      description: `Tutoring session with ${bookingData.student.name}`,
      start: {
        dateTime: new Date(`${bookingData.date}T${bookingData.startTime}`).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(`${bookingData.date}T${bookingData.endTime}`).toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: bookingData.student.email },
        { email: bookingData.tutor.email }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      }
    };
    
    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      requestBody: event
    });
    
    return response.data.id || null;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
};

/**
 * Sync tutor availability with Google Calendar
 * @param {Object} userTokens - User's Google OAuth tokens
 * @param {Object} availability - Tutor's availability slots
 * @returns {Promise<boolean>} Success indicator
 */
const syncAvailability = async (userTokens, availability) => {
  try {
    setTokens(userTokens);
    
    // Get existing availability events
    const response = await calendar.events.list({
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
      q: 'TutorLink: Availability' // Search term to find availability events
    });
    
    // Delete all existing availability events
    if (response.data.items && response.data.items.length > 0) {
      for (const event of response.data.items) {
        if (event.id) {
          await calendar.events.delete({
            auth: oauth2Client,
            calendarId: 'primary',
            eventId: event.id
          });
        }
      }
    }
    
    // Create new availability events
    for (const slot of availability) {
      for (const time of slot.slots) {
        // Convert day of week to actual date
        const date = getNextDayOfWeek(slot.day);
        
        await calendar.events.insert({
          auth: oauth2Client,
          calendarId: 'primary',
          requestBody: {
            summary: 'TutorLink: Availability',
            description: 'Available for tutoring sessions',
            start: {
              dateTime: new Date(`${date}T${time.startTime}`).toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: new Date(`${date}T${time.endTime}`).toISOString(),
              timeZone: 'UTC',
            },
            colorId: '9', // Light blue
            transparency: 'transparent' // Show as free
          }
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing availability:', error);
    return false;
  }
};

/**
 * Helper function to get the next date for a day of the week
 * @param {string} dayName - Day of the week
 * @returns {string} Date string YYYY-MM-DD
 */
const getNextDayOfWeek = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = days.indexOf(dayName);
  
  const today = new Date();
  const currentDayIndex = today.getDay();
  
  let daysUntilNext = dayIndex - currentDayIndex;
  if (daysUntilNext <= 0) {
    daysUntilNext += 7;
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);
  
  return nextDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

module.exports = {
  getAuthUrl,
  handleCallback,
  createCalendarEvent,
  syncAvailability
};