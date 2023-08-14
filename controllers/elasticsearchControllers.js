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

module.exports = {
  info,
  config,
  clean,
};
