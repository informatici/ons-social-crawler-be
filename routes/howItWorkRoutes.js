const express = require("express");
const { body } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const howItWorksControllers = require("../controllers/howItWorksControllers.js");
const router = express.Router();

router.get("/", isAuthorized(["Admin"]), howItWorksControllers.index);
router.put(
  "/",
  isAuthorized(["Admin"]),
  body("text").isString().notEmpty().escape(),
  howItWorksControllers.update
);

module.exports = router;
