const express = require("express");
const router = express.Router();
const {
  getGoogleAuthURL,
  googleCallback,
} = require("../controllers/authController");

router.get("/google", getGoogleAuthURL);
router.get("/google/callback", googleCallback);

module.exports = router;
