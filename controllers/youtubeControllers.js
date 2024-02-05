const { validationResult } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");

const videosIndexId = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const videos = await elasticsearch.getYouTubeVideos(
      req.params.videoId,
      req.params.id,
      req.query.size,
      req.query.page,
      req.query.search,
      req.query.prediction,
      req.query.sortLabel || "publishedAt",
      req.query.sortOrder || "desc",
      Date.parse(req.query.dateFrom),
      Date.parse(req.query.dateTo)
    );
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

const commentsIndex = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const comments = await elasticsearch.getYouTubeComments(
      req.query.size,
      req.query.page,
      req.query.search,
      req.query.prediction,
      req.query.sortLabel || "publishedAt",
      req.query.sortOrder || "desc",
      Date.parse(req.query.dateFrom),
      Date.parse(req.query.dateTo)
    );
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  videosIndexId,
  commentsIndex,
};
