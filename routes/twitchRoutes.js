const express = require("express");
const { param } = require("express-validator");
const twitchBot = require("../utilities/twitchBot");
const { isAuthorized } = require("../utilities/firebase.js");
// const youtubeControllers = require("../controllers/youtubeControllers");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    twitchBot.startBot();
    res.status(200).json({ msg: "Twitch stream is started" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
