require("dotenv").config();

const appName = process.env.NODE_APP_NAME;
const appDefaultPort = process.env.NODE_SERVER_PORT;
const appNodeEnv = process.env.NODE_ENV;
const twitterApiKey = process.env.NODE_TWITTER_API_KEY;
const twitterApiKeySecret = process.env.NODE_TWITTER_API_KEY_SECRET;
const twitterBearerToken = process.env.NODE_TWITTER_BEARER_TOKEN;
const elasticsearchCloudId = process.env.NODE_ELASTICSEARCH_CLOUD_ID;
const elasticsearchHost = process.env.NODE_ELASTICSEARCH_HOST;
const elasticsearchPort = process.env.NODE_ELASTICSEARCH_PORT;
const elasticsearchCaCertPath = process.env.NODE_ELASTICSEARCH_CA_CERT_PATH;
const elasticsearchUsername = process.env.NODE_ELASTICSEARCH_USERNAME;
const elasticsearchPassword = process.env.NODE_ELASTICSEARCH_PASSWORD;
const chatBotApiUrl = process.env.NODE_CHATBOT_API_URL;
const chatBotApiUsername = process.env.NODE_CHATBOT_API_USERNAME;
const chatBotApiPassword = process.env.NODE_CHATBOT_API_PASSWORD;
const youtubeApiUrl = process.env.NODE_YOUTUBE_API_URL;
const youtubeApiKey = process.env.NODE_YOUTUBE_API_KEY;
const twitchApiUrl = process.env.NODE_TWITCH_API_URL;
const twitchClientId = process.env.NODE_TWITCH_CLIENT_ID;
const twitchClientSecret = process.env.NODE_TWITCH_CLIENT_SECRET;

module.exports = {
  appName,
  appDefaultPort,
  appNodeEnv,
  twitterApiKey,
  twitterApiKeySecret,
  twitterBearerToken,
  elasticsearchCloudId,
  elasticsearchHost,
  elasticsearchPort,
  elasticsearchCaCertPath,
  elasticsearchUsername,
  elasticsearchPassword,
  chatBotApiUrl,
  chatBotApiUsername,
  chatBotApiPassword,
  youtubeApiUrl,
  youtubeApiKey,
  twitchApiUrl,
  twitchClientId,
  twitchClientSecret,
};
