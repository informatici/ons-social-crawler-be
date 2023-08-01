const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");

const instance = axios.create({
  baseURL: "https://api.twitter.com/2/",
  // timeout: 1000,
  headers: { Authorization: `Bearer ${configs.twitterBearerToken}` },
});

instance.interceptors.request.use((request) => {
  // console.log("Axios Twitter Starting Request", JSON.stringify(request));
  return request;
});

instance.interceptors.response.use((response) => {
  // console.log("Axios Twitter Response:", response);
  return response;
});

const get = () => {
  return instance.get(
    `tweets/search/recent?max_results=100&expansions=author_id&query=sport%20calcio%20%23sport%20%23calcio%20lang:it`
  );
};

exports.getTweets = async () => {
  const responseTweets = await get();
  const tweets = responseTweets?.data?.data || [];

  for (t of tweets) {
    await elasticsearch.indexTwit(t);
  }
};
