const elasticsearch = require("../utilities/elasticsearch");
const esStreamStatus = async () => {
  return await elasticsearch.getStreamStatus();
};

exports.canStart = async () => {
  const streamStatus = await esStreamStatus();
  return !streamStatus.twitter && !streamStatus.twitch && !streamStatus.youTube;
};

exports.canStartTwitter = async () => {
  const streamStatus = await esStreamStatus();
  return streamStatus.twitterFlag;
};

exports.canStarTwitch = async () => {
  const streamStatus = await esStreamStatus();
  return streamStatus.twitchFlag;
};

exports.canStartYouTube = async () => {
  const streamStatus = await esStreamStatus();
  return streamStatus.youTubeFlag;
};

exports.getStreamStatus = async () => {
  return await esStreamStatus();
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

exports.resetStreamStatus = async () => {
  const streamStatus = {
    twitter: false,
    twitch: false,
    youTube: false,
    twitterFlag: true,
    twitchFlag: true,
    youTubeFlag: true,
    twitterLength: 300,
    twitchLength: 300,
    youTubeLength: 300,
  };

  await elasticsearch.updateStreamStatus(streamStatus);

  return streamStatus;
};
