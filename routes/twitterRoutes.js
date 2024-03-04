const express = require("express");
const { query } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const twitterControllers = require("../controllers/twitterControllers");
const router = express.Router();

router.get(
  "/twits",
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
  twitterControllers.twitsIndex
);

module.exports = router;
