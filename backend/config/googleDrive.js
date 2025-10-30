const { google } = require('googleapis');
require('dotenv').config();

// Google Drive API configuration
const googleDriveConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
};

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  googleDriveConfig.clientId,
  googleDriveConfig.clientSecret,
  googleDriveConfig.redirectUri
);

// Get Google Drive instance
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

// Get OAuth2 instance for user info
const oauth2 = google.oauth2({
  version: 'v2',
  auth: oauth2Client
});

module.exports = {
  googleDriveConfig,
  oauth2Client,
  drive,
  oauth2
};