const express = require("express");
const { param, query } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const twitchControllers = require("../controllers/twitchControllers");
const router = express.Router();

router.get(
  "/streams/:streamId/:id",
  param("streamId").notEmpty(),
  param("id").notEmpty(),
  query("size").notEmpty(),
  query("page").notEmpty(),
  query("search"),
  query("prediction"),
  query("category"),
  query("sortLabel"),
  query("sortOrder"),
  query("dateFrom").notEmpty(),
  query("dateTo").notEmpty(),
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  twitchControllers.streamsIndexId
);

router.get(
  "/comments",
  query("size").notEmpty(),
  query("page").notEmpty(),
  query("search"),
  query("prediction"),
  query("category"),
  query("sortLabel"),
  query("sortOrder"),
  query("dateFrom").notEmpty(),
  query("dateTo").notEmpty(),
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  twitchControllers.commentsIndex
);

module.exports = router;
