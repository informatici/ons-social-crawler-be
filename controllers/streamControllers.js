const youtube = require("../utilities/youtube");
const twitter = require("../utilities/twitter");
const twitchBot = require("../utilities/twitchBot");

const startYouTube = async (req, res, next) => {
  try {
    await youtube.getVideos();
    res.status(200).json({ msg: "YouTube videos had been saved" });
  } catch (err) {
    next(err);
  }
};

const startTwitter = async (req, res, next) => {
  try {
    await twitter.setRules();
    await twitter.startStream();
    const response = { msg: "Twitter stream is started" };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const stopTwitter = async (req, res, next) => {
  try {
    twitter.stopStream();
    const response = { msg: "Twitter stream is stopped" };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const startTwitch = async (req, res, next) => {
  try {
    twitchBot.startBot();
    res.status(200).json({ msg: "Twitch stream is started" });
  } catch (err) {
    next(err);
  }
};

const stopTwitch = async (req, res, next) => {
  try {
    twitchBot.stopBot();
    res.status(200).json({ msg: "Twitch stream is stopped" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startYouTube,
  startTwitter,
  stopTwitter,
  startTwitch,
  stopTwitch,
};
