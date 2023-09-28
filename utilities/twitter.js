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
      `tweets/search/recent?expansions=author_id,referenced_tweets.id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&query=(sport OR calcio) lang:it -is:retweet (is:reply OR is:quote)`
    );
  } else if (pageToken) {
    responseTweets = await get(
      `tweets/search/recent?expansions=author_id,referenced_tweets.id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&since_id=${lastId}&query=(sport OR calcio) lang:it -is:retweet (is:reply OR is:quote)&next_token=${pageToken})`
    );
  } else {
    //Se lastId troppo vecchio
    try {
      responseTweets = await get(
        `tweets/search/recent?expansions=author_id,referenced_tweets.id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&since_id=${lastId}&query=(sport OR calcio) lang:it -is:retweet (is:reply OR is:quote)`
      );
    } catch {
      responseTweets = await get(
        `tweets/search/recent?expansions=author_id,referenced_tweets.id&sort_order=relevancy&tweet.fields=lang,created_at,note_tweet&query=(sport OR calcio) lang:it -is:retweet (is:reply OR is:quote)`
      );
    }
  }

  const tweets = responseTweets?.data?.data || [];
  const nextPageToken = responseTweets?.data?.meta?.next_token || "";
  // console.log("tweets", responseTweets.data);
  // console.log("nextPageToken", nextPageToken);

  for (t of tweets) {
    const lang = t.lang || "";

    if (lang === "it") {
      countTweets = await elasticsearch.indexTwit(t, countTweets);
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
