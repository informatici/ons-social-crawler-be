const express = require("express");
const { isAuthorized } = require("../utilities/firebase.js");
const streamControllers = require("../controllers/streamControllers");
const router = express.Router();

router.get("/youtube/start", isAuthorized(["Admin"]), streamControllers.startYouTube);

router.get("/twitter/start", isAuthorized(["Admin"]), streamControllers.startTwitter);
router.get("/twitter/stop", isAuthorized(["Admin"]), streamControllers.stopTwitter);

router.get("/twitch/start", isAuthorized(["Admin"]), streamControllers.startTwitch);
router.get("/twitch/stop", isAuthorized(["Admin"]), streamControllers.stopTwitch);

module.exports = router;
