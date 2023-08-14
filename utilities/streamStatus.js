let streamStatus = {
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

exports.canStart = () => {
  return !streamStatus.twitter && !streamStatus.twitch && !streamStatus.youTube;
};

exports.canStartTwitter = () => {
  return streamStatus.twitterFlag;
};

exports.canStarTwitch = () => {
  return streamStatus.twitchFlag;
};

exports.canStartYouTube = () => {
  return streamStatus.youTubeFlag;
};

exports.getStreamStatus = () => {
  return streamStatus;
};

exports.setTwitterStreamStatus = (status) => {
  streamStatus.twitter = status;
};

exports.setTwitchStreamStatus = (status) => {
  streamStatus.twitch = status;
};

exports.setYouTubeStreamStatus = (status) => {
  streamStatus.youTube = status;
};

exports.updatedStreamStatus = (data) => {
  streamStatus.twitchFlag = data.twitchStatus || false;
  streamStatus.twitchLength = data.twitchRecordLength || 250;

  streamStatus.twitterFlag = data.twitterStatus || false;
  streamStatus.twitterLength = data.twitterRecordLength || 250;

  streamStatus.youTubeFlag = data.youTubeStatus || false;
  streamStatus.youTubeLength = data.youTubeRecordLength || 250;

  return streamStatus;
};
