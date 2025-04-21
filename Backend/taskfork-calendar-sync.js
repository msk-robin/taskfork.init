// taskfork-calendar-sync.js
// Node.js script to authenticate and sync Task Fork tasks with Google Calendar

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Load credentials
const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json';

// Scopes required for Google Calendar access
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Load client secrets from a local file.
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.error('Error loading credentials.json:', err);
  authorize(JSON.parse(content), syncTaskForkTasks);
});

// Create an OAuth2 client and authenticate
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

// Get a new token and store it for future use
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error('Error saving token', err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// Example function to sync a hardcoded task to Google Calendar
function syncTaskForkTasks(auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  // Example Task Fork task
  const task = {
    title: 'Finish React onboarding flow',
    description: 'Auto-synced from Task Fork',
    start: '2025-04-21T14:00:00-07:00',
    end: '2025-04-21T15:00:00-07:00',
  };

  const event = {
    summary: task.title,
    description: task.description,
    start: {
      dateTime: task.start,
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: task.end,
      timeZone: 'America/Los_Angeles',
    },
  };

  calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  }, (err, res) => {
    if (err) return console.error('Error creating event:', err);
    console.log('Event created: %s', res.data.htmlLink);
  });
}
