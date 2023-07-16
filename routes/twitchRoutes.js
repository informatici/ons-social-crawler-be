const express = require("express");
const elasticsearch = require("../utilities/elasticsearch");
const { param } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const twitchControllers = require("../controllers/twitchControllers");
const router = express.Router();

router.get(
  "/streams/:streamId",
  param("streamId").notEmpty(),
  isAuthorized(["Admin"]),
  twitchControllers.streamsIndexId
);

router.get(
  "/comments",
  isAuthorized(["Admin"]),
  twitchControllers.commentsIndex
);

module.exports = router;
