const express = require("express");
const { body } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const streamControllers = require("../controllers/streamControllers");
const router = express.Router();

router.get(
  "/youtube/start",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  streamControllers.startYouTube
);

router.get(
  "/twitter/start",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  streamControllers.startTwitter
);

router.get(
  "/twitch/start",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  streamControllers.startTwitch
);
router.get(
  "/twitch/stop",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  streamControllers.stopTwitch
);

router.get(
  "/status",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  streamControllers.getStatus
);
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
