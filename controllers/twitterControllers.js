const twitter = require("../utilities/twitter");

const index = async (req, res, next) => {
  try {
    await twitter.setRules();
    await twitter.stream();
    const twitters = [{ name: "Twit 1" }, { name: "Twit 2" }];
    res.status(200).json(twitters);
  } catch (err) {
    next(err);
  }
};

const simple = async (req, res, next) => {
  try {
    const twitters = [{ name: "Twit 1" }, { name: "Twit 2" }];
    res.status(200).json(twitters);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  simple,
};
