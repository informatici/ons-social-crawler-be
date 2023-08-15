const { validationResult } = require("express-validator");
const youtube = require("../utilities/youtube");
const twitter = require("../utilities/twitter");
const twitchBot = require("../utilities/twitchBot");
const streamStatus = require("../utilities/streamStatus");

const startYouTube = async (req, res, next) => {
  if (
    (await streamStatus.canStart()) &&
    (await streamStatus.canStartYouTube())
  ) {
    try {
      await streamStatus.setYouTubeStreamStatus(true);
      await youtube.getVideos();
      res.status(200).json({ msg: "YouTube videos had been saved" });
    } catch (err) {
      next(err);
    } finally {
      await streamStatus.setYouTubeStreamStatus(false);
    }
  } else {
    next(new Error("A stream can not start"));
  }
};

const startTwitter = async (req, res, next) => {
  if (
    (await streamStatus.canStart()) &&
    (await streamStatus.canStartTwitter())
  ) {
    try {
      await streamStatus.setTwitterStreamStatus(true);
      await twitter.getTweets();
      res.status(200).json({ msg: "Tweets  had been saved" });
    } catch (err) {
      next(err);
    } finally {
      await streamStatus.setTwitterStreamStatus(false);
    }
  } else {
    next(new Error("A stream can not start"));
  }
};

const startTwitch = async (req, res, next) => {
  if ((await streamStatus.canStart()) && (await streamStatus.canStarTwitch())) {
    try {
      await streamStatus.setTwitchStreamStatus(true);
      twitchBot.startBot();
      res.status(200).json({ msg: "Twitch stream is started" });
    } catch (err) {
      await streamStatus.setTwitchStreamStatus(false);
      next(err);
    }
  } else {
    next(new Error("A stream can not start"));
  }
};

const stopTwitch = async (req, res, next) => {
  try {
    twitchBot.stopBot();
    res.status(200).json({ msg: "Twitch stream is stopped" });
  } catch (err) {
    next(err);
  } finally {
    await streamStatus.setTwitchStreamStatus(false);
  }
};

const getStatus = async (req, res, next) => {
  try {
    res.status(200).json(await streamStatus.getStreamStatus());
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedStreamStatus = await streamStatus.updatedStreamStatus(
      req.body
    );
    res.status(200).json(updatedStreamStatus);
  } catch (err) {
    next(err);
  }
};

const resetStatus = async (req, res, next) => {
  try {
    await streamStatus.resetStreamStatus();
    res.status(200).json({});
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startYouTube,
  startTwitter,
  startTwitch,
  stopTwitch,
  getStatus,
  updateStatus,
  resetStatus,
};
