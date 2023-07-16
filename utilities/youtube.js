const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");

const instance = axios.create({
  baseURL: configs.youtubeApiUrl,
  timeout: 1000,
});

instance.interceptors.request.use(request => {
  console.log('Axios YouTube Starting Request', JSON.stringify(request));
  return request
})

instance.interceptors.response.use(response => {
  console.log('Axios YouTube Response:', response);
  return response
})

const get = (resource, slug) => {
  return instance.get(`${resource}?key=${configs.youtubeApiKey}&${slug}`);
};

exports.getVideos = async () => {
  const responseVideos = await get(
    "videos",
    "chart=mostPopular&part=snippet,player&regionCode=it&videoCategoryId=17&maxResults=50"
  );
  const videos = responseVideos?.data?.items || [];
  for (v of videos) {
    await elasticsearch.indexYouTubeVideo(v);

    const videoId = v?.id || "";
    if (videoId !== "") {
      const responseComments = await get(
        "commentThreads",
        `videoId=${videoId}&part=snippet&maxResults=20`
      );

      const comments = responseComments?.data?.items || [];

      for (c of comments) {
        await elasticsearch.indexYouTubeComment(c);
      }
    }
  }
};
