const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");

const instance = axios.create({
  baseURL: configs.youtubeApiUrl,
  timeout: 1000,
});

const get = (resource, slug) => {
  return instance.get(`${resource}?key=${configs.youtubeApiKey}&${slug}`);
};

exports.getVideos = async () => {
  const response = await get(
    "videos",
    "chart=mostPopular&part=snippet,player&regionCode=it&videoCategoryId=17&maxResults=50"
  );
  const videos = response?.data?.items || [];
  for (v of videos) {
    await elasticsearch.indexYouTubeVideo(v);
  }
};
