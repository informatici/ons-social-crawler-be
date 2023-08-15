const elasticsearch = require("../utilities/elasticsearch");
const stremStatus = async () => {
  return await elasticsearch.getStreamStatus();
  console.log("streamStatus", streamStatus);
};

exports.canStart = async () => {
  const streamStatus = await stremStatus();
  return !streamStatus.twitter && !streamStatus.twitch && !streamStatus.youTube;
};

exports.canStartTwitter = async () => {
  const streamStatus = await stremStatus();
  return streamStatus.twitterFlag;
};

exports.canStarTwitch = async () => {
  const streamStatus = await stremStatus();
  return streamStatus.twitchFlag;
};

exports.canStartYouTube = async () => {
  const streamStatus = await stremStatus();
  return streamStatus.youTubeFlag;
};

exports.getStreamStatus = async () => {
  return await stremStatus();
};

exports.setTwitterStreamStatus = async (status) => {
  await elasticsearch.updateStreamStatus({ twitter: status });
};

exports.setTwitchStreamStatus = async (status) => {
  await elasticsearch.updateStreamStatus({ twitch: status });
};

exports.setYouTubeStreamStatus = async (status) => {
  await elasticsearch.updateStreamStatus({ youTube: status });
};

exports.updatedStreamStatus = async (data) => {
  let streamStatus = {};
  streamStatus.twitchFlag = data.twitchStatus || false;
  streamStatus.twitchLength = data.twitchRecordLength || 250;

  streamStatus.twitterFlag = data.twitterStatus || false;
  streamStatus.twitterLength = data.twitterRecordLength || 250;

  streamStatus.youTubeFlag = data.youTubeStatus || false;
  streamStatus.youTubeLength = data.youTubeRecordLength || 250;

  await elasticsearch.updateStreamStatus(streamStatus);

  return streamStatus;
};

exports.resetStreamStatus = async (data) => {
  const streamStatus = {
    twitter: false,
    twitch: false,
    youTube: false,
    twitterFlag: false,
    twitchFlag: false,
    youTubeFlag: false,
    twitterLength: 250,
    twitchLength: 250,
    youTubeLength: 250,
  };

  await elasticsearch.updateStreamStatus(streamStatus);

  return streamStatus;
};
