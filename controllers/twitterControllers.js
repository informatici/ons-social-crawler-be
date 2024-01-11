const { validationResult } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");

const twitsIndex = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const twits = await elasticsearch.getTwits(
      req.query.size,
      req.query.page,
      req.query.search,
      req.query.prediction,
      req.query.sortLabel || "createdAt",
      req.query.sortOrder || "desc",
      Date.parse(req.query.dateFrom),
      Date.parse(req.query.dateTo)
    );
    res.status(200).json(twits);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  twitsIndex,
};
