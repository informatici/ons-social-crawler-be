const configs = require("../configurations/app.config.js");
const axios = require("./axios.js");
const twitch = require("../utilities/twitch");
const uuid = require("uuid");
const moment = require("moment");
const { Client } = require("@elastic/elasticsearch");
const fs = require("fs");

// const elasticsearch = new Client({
//   cloud: {
//     id: configs.elasticsearchCloudId,
//   },
//   auth: {
//     username: configs.elasticsearchUsername,
//     password: configs.elasticsearchPassword,
//   },
// });

const elasticsearch = new Client({
  node: "https://quickstart-es-http:9200",
  auth: {
    username: "elastic",
    password: "YjcAus56gcKGL323N5Q07U82",
  },
});

// const elasticsearch = new Client({
//   node: "https://localhost:8080",
//   auth: {
//     username: "elastic",
//     password: "bM0Lq1F7435nb5HVOER06f5h",
//   },
//   tls: {
//     ca: fs.readFileSync("./http_ca.crt"),
//     rejectUnauthorized: false,
//   },
// });

exports.info = async () => {
  const info = await elasticsearch.info();
  return info;
};

exports.config = async () => {
  //twits
  const existsTwits = await elasticsearch.indices.exists({
    index: "twits",
  });
  if (!existsTwits) {
    await elasticsearch.indices.create({ index: "twits" });
  }

  //youtubevideos
  const existsYoutubeVideos = await elasticsearch.indices.exists({
    index: "youtubevideos",
  });
  if (!existsYoutubeVideos) {
    await elasticsearch.indices.create({ index: "youtubevideos" });
  }

  //youtubecomments
  const existsYoutubeComments = await elasticsearch.indices.exists({
    index: "youtubecomments",
  });
  if (!existsYoutubeComments) {
    await elasticsearch.indices.create({ index: "youtubecomments" });
  }

  //twitchstreams
  const existsTwitchStreams = await elasticsearch.indices.exists({
    index: "twitchstreams",
  });
  if (!existsTwitchStreams) {
    await elasticsearch.indices.create({ index: "twitchstreams" });
  }

  //twitchcomments
  const existsTwitchComments = await elasticsearch.indices.exists({
    index: "twitchcomments",
  });
  if (!existsTwitchComments) {
    await elasticsearch.indices.create({ index: "twitchcomments" });
  }
};

// Twitter
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

exports.getTwits = async () => {
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

// YouTube
exports.indexYouTubeVideo = async (data) => {
  try {
    const video = {
      id: data.id || "",
      publishedAt: data?.snippet?.publishedAt || "",
      title: data?.snippet?.title || "",
      description: data?.snippet?.description || "",
      tags: data?.snippet?.tags || [],
      channelId: data?.snippet?.channelId || "",
      channelTitle: data?.snippet?.channelTitle || "",
      player: data?.player?.embedHtml || "",
      timestamp: Date.now(),
    };

    await elasticsearch.index({
      index: "youtubevideos",
      document: {
        video,
      },
    });
  } catch (e) {
    console.log("Error", e);
  }
};

exports.getYouTubeVideos = async (videoId) => {
  try {
    const result = {
      video: {},
      comments: [],
    };
    const res = await elasticsearch.search({
      index: "youtubevideos",
      size: 1,
      query: {
        match: {
          "video.id": videoId,
        },
      },
    });

    const videos = res?.hits?.hits || [];
    if (videos.length === 1) {
      result.video = videos[0]._source.video;

      const comments = await elasticsearch.search({
        index: "youtubecomments",
        size: 100,
        query: {
          match: {
            "comment.videoId": videoId,
          },
        },
        sort: [{ "comment.publishedAt": { order: "desc" } }],
      });

      result.comments = comments?.hits?.hits || [];
    }

    return result;
  } catch (err) {
    throw err;
  }
};

exports.indexYouTubeComment = async (data) => {
  try {
    const isPublic = data?.snippet?.isPublic || false;

    if (isPublic) {
      const comment = {
        id: data.id || "",
        publishedAt: data?.snippet?.topLevelComment?.snippet?.publishedAt || "",
        textDisplay: data?.snippet?.topLevelComment?.snippet?.textDisplay || "",
        videoId: data?.snippet?.videoId || "",
        prediction: null,
        response: null,
        timestamp: Date.now(),
      };

      const chatBotPrediction = await axios.post(
        "predict/hatespeechdictionary",
        {
          source: "youtube",
          items: [{ id: comment.id, text: comment.textDisplay }],
        }
      );

      const isHate = chatBotPrediction?.data?.response[0]?.prediction || 0;

      if (isHate === 1) {
        comment.prediction = chatBotPrediction.data.response[0];

        const chatBotResponse = await axios.post("chatter/mainchatter", {
          source: "youtube",
          text: comment.textDisplay,
        });

        comment.response = chatBotResponse.data.response;
      }

      await elasticsearch.index({
        index: "youtubecomments",
        document: {
          comment,
        },
      });
    }
  } catch (e) {
    console.log("Error", e);
  }
};

exports.getYouTubeComments = async () => {
  try {
    const comments = await elasticsearch.search({
      index: "youtubecomments",
      size: 100,
      sort: [{ "comment.publishedAt": { order: "desc" } }],
    });
    return comments?.hits || [];
  } catch (err) {
    throw err;
  }
};

// Twitch
exports.indexTwitchStream = async (stream) => {
  try {
    await elasticsearch.index({
      index: "twitchstreams",
      document: {
        stream,
      },
    });
  } catch (e) {
    console.log("Error", e);
  }
};

exports.indexTwitchComment = async (data) => {
  try {
    const comment = {
      id: uuid.v4(),
      publishedAt: moment.utc().toISOString(),
      textDisplay: data?.message || "",
      channelName: data?.channelName || "",
      streamId: data?.streamId || "",
      prediction: null,
      response: null,
      timestamp: Date.now(),
    };

    const chatBotPrediction = await axios.post("predict/hatespeechdictionary", {
      source: "twitch",
      items: [{ id: comment.streamId, text: comment.textDisplay }],
    });

    const isHate = chatBotPrediction?.data?.response[0]?.prediction || 0;

    if (isHate === 1) {
      comment.prediction = chatBotPrediction.data.response[0];

      const chatBotResponse = await axios.post("chatter/mainchatter", {
        source: "twitch",
        text: comment.textDisplay,
      });

      comment.response = chatBotResponse.data.response;
    }

    await elasticsearch.index({
      index: "twitchcomments",
      document: {
        comment,
      },
    });
  } catch (e) {
    console.log("Error", e);
  }
};

exports.getTwitchStream = async (streamId) => {
  try {
    const result = {
      stream: {},
      video: {},
      comments: [],
    };
    const res = await elasticsearch.search({
      index: "twitchstreams",
      size: 1,
      query: {
        match: {
          "stream.id": streamId,
        },
      },
    });

    const streams = res?.hits?.hits || [];
    if (streams.length === 1) {
      result.stream = streams[0]._source.stream;

      const comments = await elasticsearch.search({
        index: "twitchcomments",
        size: 100,
        query: {
          match: {
            "comment.streamId": streamId,
          },
        },
        sort: [{ "comment.publishedAt": { order: "desc" } }],
      });

      result.comments = comments?.hits?.hits || [];

      result.video = await twitch.getVideo(result.stream);
    }

    return result;
  } catch (err) {
    throw err;
  }
};

exports.getTwitchComments = async () => {
  try {
    const comments = await elasticsearch.search({
      index: "twitchcomments",
      size: 100,
      sort: [{ "comment.publishedAt": { order: "desc" } }],
    });
    return comments?.hits || [];
  } catch (err) {
    throw err;
  }
};
