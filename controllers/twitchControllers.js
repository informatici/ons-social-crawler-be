const elasticsearch = require("../utilities/elasticsearch");

const streamsIndexId = async (req, res, next) => {
  try {
    const stream = await elasticsearch.getTwitchStream(req.params.streamId);
    res.status(200).json(stream);
  } catch (err) {
    next(err);
  }
}

const commentsIndex = async (req, res, next) => {
  try {
    const comments = await elasticsearch.getTwitchComments();
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  streamsIndexId,
  commentsIndex,
};
