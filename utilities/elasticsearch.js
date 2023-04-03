const configs = require("../configurations/app.config.js");
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
  await elasticsearch.indices.create({
    index: "twits",
    // mappings: {
    //   properties: {
    //     field1: { type: "text" },
    //   },
    // },
  });

  const res1 = await elasticsearch.index({
    index: "test",
    document: {
      field1: "Test 1",
    },
  });
  console.log(res1);

  const res2 = await elasticsearch.index({
    index: "test",
    document: {
      field1: "Test 2",
    },
  });
  console.log(res2);
};

exports.indexTwit = async (data) => {
  await elasticsearch.index({
    index: "twits",
    document: {
      data,
    },
  });
};

exports.getTwits = async (data) => {
  try {
    const twits = await elasticsearch.search({
      index: "twits",
    });
    return twits;
  } catch (err) {
    throw err;
  }
};
