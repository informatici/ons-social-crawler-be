const express = require("express");
const { isAuthorized } = require("../utilities/firebase.js");
const twitterControllers = require("../controllers/twitterControllers");
const router = express.Router();

router.get("/twits",
  isAuthorized(["Admin"]),
  twitterControllers.twitsIndex
);

module.exports = router;
