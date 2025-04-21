const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const credentials = JSON.parse(
  fs.readFileSync(process.env.GOOGLE_CREDENTIALS_PATH, "utf-8")
);
const { client_id, client_secret, redirect_uris } = credentials.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] // Make sure this is the correct redirect URI in your OAuth config
);

// Generate Google Auth URL
exports.getGoogleAuthURL = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar", "profile"],
  });

  res.redirect(url);
};

// Callback after login
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const token = jwt.sign(
      { userId: userInfo.id, tokens },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send to frontend with token
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Google auth failed");
  }
};
