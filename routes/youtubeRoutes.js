const express = require("express");
const { param } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");
const { isAuthorized } = require("../utilities/firebase.js");
const youtubeControllers = require("../controllers/youtubeControllers");
const router = express.Router();

router.get("/", youtubeControllers.index);
router.get(
  "/elasticsearch/videos/:videoId",
  param("videoId").notEmpty(),
  isAuthorized(["Admin"]),
  async (req, res, next) => {
    try {
      const videos = await elasticsearch.getYouTubeVideos(req.params.videoId);
      res.status(200).json(videos);
    } catch (err) {
      next(err);
    }
  }
);
// router.get(
//   "/elasticsearch/videos",
//   isAuthorized(["Admin"]),
//   async (req, res, next) => {
//     try {
//       const videos = await elasticsearch.getYouTubeVideos();
//       res.status(200).json(videos);
//     } catch (err) {
//       next(err);
//     }
//   }
// );
router.get(
  "/elasticsearch/comments",
  isAuthorized(["Admin"]),
  async (req, res, next) => {
    try {
      const comments = await elasticsearch.getYouTubeComments();
      res.status(200).json(comments);
    } catch (err) {
      next(err);
    }
  }
);
// router.get(
//   "/elasticsearch/comments/:videoId",
//   param("videoId").notEmpty(),
//   isAuthorized(["Admin"]),
//   async (req, res, next) => {
//     try {
//       const comments = await elasticsearch.getYouTubeComments(
//         req.params.videoId
//       );
//       res.status(200).json(comments);
//     } catch (err) {
//       next(err);
//     }
//   }
// );

module.exports = router;
