const configs = require("../configurations/app.config.js");
const axios = require("axios");
const token = `Basic ${Buffer.from(
  configs.chatBotApiUsername + ":" + configs.chatBotApiPassword
).toString("base64")}`;

const instance = axios.create({
  baseURL: configs.chatBotApiUrl,
  // timeout: 2000,
  headers: { Accept: "application/json", Authorization: token },
});

exports.get = (resource) => {
  return instance.get(resource);
};

exports.post = (resource, params) => {
  return instance.post(resource, params);
};

instance.interceptors.request.use((request) => {
  // console.log('Axios Bot Starting Request', JSON.stringify(request))
  return request;
});

instance.interceptors.response.use((response) => {
  // console.log('Axios Bot Response', response);
  return response;
});
