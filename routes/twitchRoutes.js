const express = require("express");
const { param, query } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const twitchControllers = require("../controllers/twitchControllers");
const router = express.Router();

router.get(
  "/streams/:streamId",
  param("streamId").notEmpty(),
  query("size").notEmpty(),
  query("page").notEmpty(),
  query("search"),
  query("prediction"),
  query("sortLabel"),
  query("sortOrder"),
  isAuthorized(["Admin"]),
  twitchControllers.streamsIndexId
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
  twitchControllers.commentsIndex
);

module.exports = router;
