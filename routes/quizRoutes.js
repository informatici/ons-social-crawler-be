const express = require("express");
const { body } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const quizControllers = require("../controllers/quizControllers.js");
const router = express.Router();

router.post(
  "/",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  body("type").isNumeric({ min: 0 }),
  quizControllers.create
);
router.put(
  "/",
  isAuthorized(["Admin"]),
  body("text").isString(),
  quizControllers.update
);

module.exports = router;
