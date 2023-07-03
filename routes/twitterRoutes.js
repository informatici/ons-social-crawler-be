const express = require("express");
const { body } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");
const { isAuthorized } = require("../utilities/firebase.js");
const twitterControllers = require("../controllers/twitterControllers");
const router = express.Router();

router.get("/start", twitterControllers.index);
router.get("/stop", twitterControllers.stopStream);
router.get("/simple", twitterControllers.simple);
router.get("/elasticsearch/info", async (req, res, next) => {
  try {
    const info = await elasticsearch.info();
    res.status(200).json(info);
  } catch (err) {
    next(err);
  }
});
router.get("/elasticsearch/config", async (req, res, next) => {
  try {
    await elasticsearch.config();
    res.status(200).json({});
  } catch (err) {
    next(err);
  }
});
router.get(
  "/elasticsearch/twits",
  isAuthorized(["Admin"]),
  async (req, res, next) => {
    try {
      const twits = await elasticsearch.getTwits();
      res.status(200).json(twits);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
