const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const axios = require("axios");
const streamStatus = require("../utilities/streamStatus");

let countTweets = 0;
let twitterLength = 0;
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

const get = (slug) => {
  return instance.get(`${slug}`);
};

const saveTweets = async (pageToken = "") => {
  const lastId = await elasticsearch.getLastTwitId();
  // console.log("lastId", lastId);
  let responseTweets = "";
  if (!lastId) {
    responseTweets = await get(
      `tweets/search/recent?expansions=author_id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&query=(sport)%20lang:it%20(calcio)%20lang:it`
    );
  } else if (pageToken) {
    responseTweets = await get(
      `tweets/search/recent?expansions=author_id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&since_id=${lastId}&query=(sport)%20lang:it%20(calcio)%20lang:it&next_token=${pageToken}`
    );
  } else {
    responseTweets = await get(
      `tweets/search/recent?expansions=author_id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&since_id=${lastId}&query=(sport)%20lang:it%20(calcio)%20lang:it`
    );
  }

  // &query=sport%20calcio%20%23sport%20%23calcio%20lang:it
  // &query=(sport)%20lang:it%20(calcio)%20lang:it
  const tweets = responseTweets?.data?.data || [];
  const nextPageToken = responseTweets?.data?.meta?.next_token || "";
  // console.log("tweets", responseTweets.data);
  // console.log("nextPageToken", nextPageToken);

  for (t of tweets) {
    const lang = t.lang || "";

    if (lang === "it") {
      // console.log("t", t);
      countTweets = await elasticsearch.indexTwit(t, countTweets);
      // console.log("countTweets", countTweets);
    }

    if (countTweets >= twitterLength) {
      return;
    }
  }

  if (nextPageToken) {
    await saveTweets(nextPageToken);
  }
};

exports.getTweets = async () => {
  const res = await streamStatus.getStreamStatus();
  if (res.twitterLength > 0) {
    twitterLength = res.twitterLength;
    countTweets = 0;
    await saveTweets();
  }
};
