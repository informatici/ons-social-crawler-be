const configs = require("../configurations/app.config.js");
const elasticsearch = require("../utilities/elasticsearch");
const { TwitterApi, ETwitterStreamEvent } = require("twitter-api-v2");

const twitterClient = new TwitterApi(configs.twitterBearerToken);

exports.setRules = async () => {
  const rules = await twitterClient.v2.streamRules();

  // Remove rules
  if (rules.meta.result_count > 0) {
    let ids = [];
    for (const r of rules.data) {
      ids.push(r.id);
    }
    await twitterClient.v2.updateStreamRules({
      delete: {
        ids,
      },
    });
  }

  // Add rules
  const addedRules = await twitterClient.v2.updateStreamRules({
    add: [
      { value: "(sport) lang:it", tag: "sport" },
      { value: "(calcio) lang:it", tag: "calcio" },
    ],
  });
  console.log("Added rules", addedRules);
};

exports.stream = async () => {
  const stream = twitterClient.v2.searchStream({
    autoConnect: false,
    expansions: ["author_id"],
  });

  // Awaits for a tweet
  stream.on(
    // Emitted when Node.js {response} emits a 'error' event (contains its payload).
    ETwitterStreamEvent.ConnectionError,
    (err) => console.log("Connection error!", err)
  );

  stream.on(
    // Emitted when Node.js {response} is closed by remote or using .close().
    ETwitterStreamEvent.ConnectionClosed,
    () => console.log("Connection has been closed.")
  );

  stream.on(
    // Emitted when a Twitter payload (a tweet or not, given the endpoint).
    ETwitterStreamEvent.Data,
    (eventData) => {
      console.log("Twitter has sent something:", eventData);
      elasticsearch.indexTwit(eventData.data);
    }
  );

  stream.on(
    // Emitted when a Twitter sent a signal to maintain connection active
    ETwitterStreamEvent.DataKeepAlive,
    () => console.log("Twitter has a keep-alive packet.")
  );

  await stream.connect({ autoReconnect: true, autoReconnectRetries: Infinity });
};
