const configs = require("../configurations/app.config.js");
const axios = require("axios");
const token = `Basic ${Buffer.from(
  configs.chatBotApiUsername + ":" + configs.chatBotApiPassword
).toString("base64")}`;

const instance = axios.create({
  baseURL: configs.chatBotApiUrl,
  timeout: 1000,
  headers: { Accept: "application/json", Authorization: token },
});

exports.get = (resource) => {
  return instance.get(resource);
};

exports.post = (resource, params) => {
  return instance.post(resource, params);
};
