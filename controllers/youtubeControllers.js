const elasticsearch = require("../utilities/elasticsearch");

const videosIndexId = async (req, res, next) => {
  try {
    const videos = await elasticsearch.getYouTubeVideos(req.params.videoId);
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

const commentsIndex = async (req, res, next) => {
  try {
    const comments = await elasticsearch.getYouTubeComments();
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  videosIndexId,
  commentsIndex,
};
