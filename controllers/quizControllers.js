const { validationResult } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");

const create = async (req, res, next) => {
  try {
    const comment = await elasticsearch.getRandomItem();
    console.log(comment);

    const quiz = {
      id: Date.now(),
      type: req.body.type,
      description: comment.textDisplay || comment.text,
      hasHate: comment.prediction ? true : false,
    };

    res.status(200).json(quiz);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const howItWorks = await elasticsearch.updateHowItWorks(req.body.text);
    res.status(200).json(howItWorks);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  update,
};
