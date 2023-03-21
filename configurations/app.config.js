require("dotenv").config();

const appName = process.env.NODE_APP_NAME;
const appDefaultPort = process.env.NODE_SERVER_PORT;
const appNodeEnv = process.env.NODE_ENV;

module.exports = {
  appName,
  appDefaultPort,
  appNodeEnv,
};
