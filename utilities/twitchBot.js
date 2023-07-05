const tmi = require("tmi.js");
const elasticsearch = require("../utilities/elasticsearch");
const twitch = require("../utilities/twitch");

let client = null;
let channels = [];

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

    console.log("channel", channel);
    console.log("tags", tags);
    console.log("msg", message);
    console.log("-------------");
}


const onConnectedHandler = (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
}

exports.startBot = async () => {
    const streams = await twitch.getStreams();

    if (streams.length > 0) {

        channels = streams.map((c) => {
            return {
                streamId: c.id,
                userLogin: c.user_login,
            }
        })

        const channelNames = channels.map((c) => c.userLogin);

        console.log(channels);
        console.log(channelNames);

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
}

exports.stopBot = () => {
    if(!client) return;
    client.disconnect()
}
