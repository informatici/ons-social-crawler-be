const express = require("express");
const { param } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const youtubeControllers = require("../controllers/youtubeControllers");
const router = express.Router();

router.get(
  "/videos/:videoId",
  param("videoId").notEmpty(),
  isAuthorized(["Admin"]),
  youtubeControllers.videosIndexId
);

router.get(
  "/comments",
  isAuthorized(["Admin"]),
  youtubeControllers.commentsIndex
);

module.exports = router;
