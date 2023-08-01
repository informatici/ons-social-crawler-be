const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");
const querystring = require("querystring");

const instance = axios.create({
  baseURL: configs.twitchApiUrl,
  // timeout: 1000,
  headers: {
    "Client-Id": configs.twitchClientId,
  },
});

instance.interceptors.request.use((request) => {
  //   console.log("Axios Twitch Starting Request", JSON.stringify(request));
  return request;
});

instance.interceptors.response.use((response) => {
  //   console.log("Axios Twitch Response:", response);
  return response;
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

exports.getVideo = async (stream) => {
  await getToken();
  const res = await instance.get(
    `videos?user_id=${stream.user_id}&type=archive`
  );

  const videos = res.data?.data || [];

  const video = videos.find((v) => v.stream_id === stream.id);

  return video || {};
};
