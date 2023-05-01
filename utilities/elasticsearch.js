const configs = require("../configurations/app.config.js");
const axios = require("./axios.js");
const { Client } = require("@elastic/elasticsearch");
const elasticsearch = new Client({
  cloud: {
    id: configs.elasticsearchCloudId,
  },
  auth: {
    username: configs.elasticsearchUsername,
    password: configs.elasticsearchPassword,
  },
});

exports.info = async () => {
  const info = await elasticsearch.info();
  return info;
};

exports.config = async () => {
  const { body: exists } = await elasticsearch.indices.exists({
    index: "twits",
  });
  if (exists) return;
  await elasticsearch.indices.create({});
};

exports.indexTwit = async (data) => {
  try {
    data.text = data.text
      .replace(/\B@\w*[a-zA-Z:]+\w*/g, "")
      .replace(/(^RT)/g, "")
      .trim();
    data.prediction = null;
    data.response = null;
    data.timestamp = Date.now();

    const chatBotPrediction = await axios.post("predict/hatespeechdictionary", {
      source: "twitter",
      items: [{ id: data.id, text: data.text }],
    });

    const isHate = chatBotPrediction?.data?.response[0]?.prediction || 0;

    if (isHate === 1) {
      data.prediction = chatBotPrediction.data.response[0];

      const chatBotResponse = await axios.post("chatter/mainchatter", {
        source: "twitter",
        text: data.text,
      });

      data.response = chatBotResponse.data.response;
    }

    await elasticsearch.index({
      index: "twits",
      document: {
        data,
      },
    });

    console.log(data);
    console.log("------------");
  } catch (e) {
    console.log("Error", e);
  }
};

exports.getTotalTwits = async (data) => {
  try {
    const twits = await elasticsearch.search({
      index: "twits",
      size: 0,
    });
    return twits;
  } catch (err) {
    throw err;
  }
};

exports.getTwits = async (data) => {
  try {
    const twits = await elasticsearch.search({
      index: "twits",
      size: 100,
      sort: [{ "data.timestamp": { order: "desc" } }],
    });
    return twits;
  } catch (err) {
    throw err;
  }
};
