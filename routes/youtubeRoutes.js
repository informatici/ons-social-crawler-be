const express = require("express");
const { param, query } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const youtubeControllers = require("../controllers/youtubeControllers");
const router = express.Router();

router.get(
  "/videos/:videoId",
  param("videoId").notEmpty(),
  query("size").notEmpty(),
  query("page").notEmpty(),
  query("search"),
  query("prediction"),
  query("sortLabel"),
  query("sortOrder"),
  isAuthorized(["Admin"]),
  youtubeControllers.videosIndexId
);

router.get(
  "/comments",
  query("size").notEmpty(),
  query("page").notEmpty(),
  query("search"),
  query("prediction"),
  query("sortLabel"),
  query("sortOrder"),
  isAuthorized(["Admin"]),
  youtubeControllers.commentsIndex
);

module.exports = router;
