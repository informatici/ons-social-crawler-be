const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");
const streamStatus = require("../utilities/streamStatus");

let countComments = 0;
let youTubeLength = 0;
const instance = axios.create({
  baseURL: configs.youtubeApiUrl,
  // timeout: 1000,
});

instance.interceptors.request.use((request) => {
  // console.log("Axios YouTube Starting Request", JSON.stringify(request));
  return request;
});

instance.interceptors.response.use((response) => {
  // console.log("Axios YouTube Response:", response);
  return response;
});

const get = (resource, slug) => {
  return instance.get(`${resource}?key=${configs.youtubeApiKey}&${slug}`);
};

const saveVideos = async (pageToken = "") => {
  const responseVideos = await get(
    "videos",
    `chart=mostPopular&part=snippet,player&regionCode=it&videoCategoryId=17&pageToken=${pageToken}`
  );
  const videos = responseVideos?.data?.items || [];
  const nextPageToken = responseVideos?.data?.nextPageToken || "";
  for (v of videos) {
    const defaultAudioLanguage = v?.snippet?.defaultAudioLanguage || "";
    if (defaultAudioLanguage === "it") {
      await elasticsearch.indexYouTubeVideo(v);

      const videoId = v?.id || "";
      if (videoId !== "") {
        const responseComments = await get(
          "commentThreads",
          `videoId=${videoId}&part=snippet&maxResults=100`
        );

        const comments = responseComments?.data?.items || [];

        for (c of comments) {
          countComments = await elasticsearch.indexYouTubeComment(
            c,
            countComments
          );
          if (countComments >= youTubeLength) {
            return;
          }
        }
      }
    }
  }

  if (nextPageToken) {
    await saveVideos(nextPageToken);
  }
};

exports.getVideos = async () => {
  const res = await streamStatus.getStreamStatus();
  if (res.youTubeLength > 0) {
    youTubeLength = res.youTubeLength;
    countComments = 0;
    await saveVideos();
  }
};
