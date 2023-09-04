const { validationResult } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");

const info = async (req, res, next) => {
  try {
    const info = await elasticsearch.info();
    res.status(200).json(info);
  } catch (err) {
    next(err);
  }
};

const config = async (req, res, next) => {
  try {
    await elasticsearch.config();
    res.status(200).json({});
  } catch (err) {
    next(err);
  }
};

const clean = async (req, res, next) => {
  try {
    await elasticsearch.clean();
    res.status(200).json({});
  } catch (err) {
    next(err);
  }
};

const query = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let result = null;

    switch (req.params.social) {
      case "twitch":
        result = await elasticsearch.getTwitchComments(
          req.query.size,
          req.query.page
        );
        result = result.hits.map((x) => x._source.comment);
        break;
      case "youtube":
        result = await elasticsearch.getYouTubeComments(
          req.query.size,
          req.query.page
        );
        result = result.hits.map((x) => x._source.comment);
        break;
      case "twitter":
        result = await elasticsearch.getTwits(req.query.size, req.query.page);
        result = result.hits.hits.map((x) => x._source.data);
        break;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  info,
  config,
  clean,
  query,
};
