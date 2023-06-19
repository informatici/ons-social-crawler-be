const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");
const querystring = require("querystring");

const instance = axios.create({
    baseURL: configs.twitchApiUrl,
    timeout: 1000,
    headers: {
        "Client-Id": configs.twitchClientId,
    },
});

const getToken = async () => {
    const res = await axios.post(
        "https://id.twitch.tv/oauth2/token",
        querystring.stringify({
            client_id: configs.twitchClientId,
            client_secret: configs.twitchClientSecret,
            grant_type: "client_credentials",
        })
    );
    const token = res.data?.access_token || "";
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

exports.getStreams = async () => {
    await getToken();
    const res = await instance.get(
        "streams?game_id=518203&language=it&type=live"
    );

    const streams = res.data?.data || [];

    for (s of streams) {
        await elasticsearch.indexTwitchStream(s);
    }

    return streams;
};
