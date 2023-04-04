const express = require("express");
const { body } = require("express-validator");
const twitterControllers = require("../controllers/twitterControllers");
const router = express.Router();

router.get("/", twitterControllers.index);
router.get("/simple", twitterControllers.simple);

module.exports = router;
