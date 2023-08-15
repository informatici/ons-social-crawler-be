const express = require("express");
const { body } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const streamControllers = require("../controllers/streamControllers");
const router = express.Router();

router.get(
  "/youtube/start",
  isAuthorized(["Admin"]),
  streamControllers.startYouTube
);

router.get(
  "/twitter/start",
  isAuthorized(["Admin"]),
  streamControllers.startTwitter
);

router.get(
  "/twitch/start",
  isAuthorized(["Admin"]),
  streamControllers.startTwitch
);
router.get(
  "/twitch/stop",
  isAuthorized(["Admin"]),
  streamControllers.stopTwitch
);

router.get("/status", isAuthorized(["Admin"]), streamControllers.getStatus);
router.put(
  "/status",
  isAuthorized(["Admin"]),
  body("twitchStatus").isBoolean().notEmpty(),
  body("twitchRecordLength").isNumeric().notEmpty(),
  body("twitterStatus").isBoolean().notEmpty(),
  body("twitterRecordLength").isNumeric().notEmpty(),
  body("youTubeStatus").isBoolean().notEmpty(),
  body("youTubeRecordLength").isNumeric().notEmpty(),
  streamControllers.updateStatus
);
router.post(
  "/status/reset",
  isAuthorized(["Admin"]),
  streamControllers.resetStatus
);

module.exports = router;
