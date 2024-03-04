const { validationResult } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");

const streamsIndexId = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const stream = await elasticsearch.getTwitchStream(
      req.params.streamId,
      req.params.id,
      req.query.size,
      req.query.page,
      req.query.search,
      req.query.prediction,
      req.query.sortLabel || "publishedAt",
      req.query.sortOrder || "desc",
      Date.parse(req.query.dateFrom),
      Date.parse(req.query.dateTo),
      req.query.category
    );
    res.status(200).json(stream);
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
    const comments = await elasticsearch.getTwitchComments(
      req.query.size,
      req.query.page,
      req.query.search,
      req.query.prediction,
      req.query.sortLabel || "publishedAt",
      req.query.sortOrder || "desc",
      Date.parse(req.query.dateFrom),
      Date.parse(req.query.dateTo),
      req.query.category
    );
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  streamsIndexId,
  commentsIndex,
};
