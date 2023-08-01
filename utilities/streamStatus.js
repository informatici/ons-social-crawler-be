let streamStatus = {
  twitter: false,
  twitch: false,
  youTube: false,
};

exports.canStart = () => {
  return !streamStatus.twitter && !streamStatus.twitch && !streamStatus.youTube;
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
