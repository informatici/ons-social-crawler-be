const tmi = require("tmi.js");
const elasticsearch = require("../utilities/elasticsearch");
const twitch = require("../utilities/twitch");
const streamStatus = require("../utilities/streamStatus");

let client = null;
let channels = [];
let countMessages = 0;

const onMessageHandler = async (channel, tags, msg, self) => {
  if (self) {
    return;
  }

  const message = msg.trim();
  const channelName = channel.slice(1);
  const stream = channels.find((x) => x.userLogin === channelName);

  const data = {
    streamId: stream.streamId,
    channelName,
    message,
  };

  await elasticsearch.indexTwitchComment(data);

  countMessages++;

  if (countMessages >= streamStatus.getStreamStatus().twitchLength) {
    this.stopBot();
    streamStatus.setTwitchStreamStatus(false);
  }
};

const onConnectedHandler = (addr, port) => {
  console.log(`* Connected to ${addr}:${port}`);
};

exports.startBot = async () => {
  countMessages = 0;
  const streams = await twitch.getStreams();

  if (streams.length > 0) {
    channels = streams.map((c) => {
      return {
        streamId: c.id,
        userLogin: c.user_login,
      };
    });

    const channelNames = channels.map((c) => c.userLogin);

    const opts = {
      identity: {
        username: "aldavsoftware",
        password: "oauth:zbnbw2afi6axrzqlzdlh1w0afas988",
      },
      channels: channelNames,
    };

    client = new tmi.client(opts);
    client.on("message", onMessageHandler);
    client.on("connected", onConnectedHandler);
    client.connect();
  }
};

exports.stopBot = () => {
  if (!client) return;
  client.disconnect();
  client = null;
};
