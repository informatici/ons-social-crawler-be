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
router.post(
  "/export",
  isAuthorized(["Admin", "Teacher", "Trainer"]),
  body("quiz").isArray(),
  quizControllers.exportQuiz
);

module.exports = router;
