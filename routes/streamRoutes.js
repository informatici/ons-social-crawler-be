const express = require("express");
const { isAuthorized } = require("../utilities/firebase.js");
const streamControllers = require("../controllers/streamControllers");
const router = express.Router();

router.get("/youtube/start", isAuthorized(["Admin"]), streamControllers.startYouTube);

router.get("/twitter/start", streamControllers.startTwitter);
router.get("/twitter/stop", streamControllers.stopTwitter);

router.get("/twitch/start", streamControllers.startTwitch);
router.get("/twitch/stop", streamControllers.stopTwitch);

module.exports = router;
