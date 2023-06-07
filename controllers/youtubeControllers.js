const youtube = require("../utilities/youtube");

const index = async (req, res, next) => {
  try {
    await youtube.getVideos();
    res.status(200).json({ msg: "YouTube videos had been saved" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
};
