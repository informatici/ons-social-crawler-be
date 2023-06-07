require("dotenv").config();

const appName = process.env.NODE_APP_NAME;
const appDefaultPort = process.env.NODE_SERVER_PORT;
const appNodeEnv = process.env.NODE_ENV;
const twitterApiKey = process.env.NODE_TWITTER_API_KEY;
const twitterApiKeySecret = process.env.NODE_TWITTER_API_KEY_SECRET;
const twitterBearerToken = process.env.NODE_TWITTER_BEARER_TOKEN;
const elasticsearchCloudId = process.env.NODE_ELASTICSEARCH_CLOUD_ID;
const elasticsearchUsername = process.env.NODE_ELASTICSEARCH_USERNAME;
const elasticsearchPassword = process.env.NODE_ELASTICSEARCH_PASSWORD;
const chatBotApiUrl = process.env.NODE_CHATBOT_API_URL;
const chatBotApiUsername = process.env.NODE_CHATBOT_API_USERNAME;
const chatBotApiPassword = process.env.NODE_CHATBOT_API_PASSWORD;
const youtubeApiUrl = process.env.NODE_YOUTUBE_API_URL;
const youtubeApiKey = process.env.NODE_YOUTUBE_API_KEY;

module.exports = {
  appName,
  appDefaultPort,
  appNodeEnv,
  twitterApiKey,
  twitterApiKeySecret,
  twitterBearerToken,
  elasticsearchCloudId,
  elasticsearchUsername,
  elasticsearchPassword,
  chatBotApiUrl,
  chatBotApiUsername,
  chatBotApiPassword,
  youtubeApiUrl,
  youtubeApiKey,
};
