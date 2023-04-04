require("dotenv").config();

const appName = process.env.NODE_APP_NAME;
const appDefaultPort = process.env.NODE_SERVER_PORT;
const appNodeEnv = process.env.NODE_ENV;
const twitterApiKey = process.env.NODE_TWITTER_API_KEY;
const twitterApiKeySecret = process.env.NODE_TWITTER_API_KEY_SECRET;
const twitterBearerToken = process.env.NODE_TWITTER_BEARER_TOKEN;

module.exports = {
  appName,
  appDefaultPort,
  appNodeEnv,
  twitterApiKey,
  twitterApiKeySecret,
  twitterBearerToken,
};
