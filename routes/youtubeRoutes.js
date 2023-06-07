const express = require("express");
const { body } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");
const { isAuthorized } = require("../utilities/firebase.js");
const youtubeControllers = require("../controllers/youtubeControllers");
const router = express.Router();

router.get("/", youtubeControllers.index);
router.get(
  "/elasticsearch/videos",
  isAuthorized(["Admin"]),
  async (req, res, next) => {
    try {
      const videos = await elasticsearch.getYouTubeVideos();
      res.status(200).json(videos);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
