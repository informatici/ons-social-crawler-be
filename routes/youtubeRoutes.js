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
  query("dateFrom").notEmpty(),
  query("dateTo").notEmpty(),
  isAuthorized(["Admin", "Teacher", "Trainer"]),
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
  query("dateFrom").notEmpty(),
  query("dateTo").notEmpty(),
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  youtubeControllers.commentsIndex
);

module.exports = router;
