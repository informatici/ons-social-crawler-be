const elasticsearch = require("../utilities/elasticsearch");

const twitsIndex = async (req, res, next) => {
  try {
    const twits = await elasticsearch.getTwits();
    res.status(200).json(twits);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  twitsIndex,
};
