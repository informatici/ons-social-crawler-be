const express = require("express");
const elasticsearch = require("../utilities/elasticsearch");
const { param } = require("express-validator");
const twitchBot = require("../utilities/twitchBot");
const { isAuthorized } = require("../utilities/firebase.js");
// const youtubeControllers = require("../controllers/youtubeControllers");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    twitchBot.startBot();
    res.status(200).json({ msg: "Twitch stream is started" });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/elasticsearch/streams/:streamId",
  param("streamId").notEmpty(),
  isAuthorized(["Admin"]),
  async (req, res, next) => {
    try {
      const stream = await elasticsearch.getTwitchStream(req.params.streamId);
      res.status(200).json(stream);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/elasticsearch/comments",
  isAuthorized(["Admin"]),
  async (req, res, next) => {
    try {
      const comments = await elasticsearch.getTwitchComments();
      res.status(200).json(comments);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
