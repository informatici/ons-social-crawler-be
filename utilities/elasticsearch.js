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
  node:
    "https://" + configs.elasticsearchHost + ":" + configs.elasticsearchPort,
  auth: {
    username: configs.elasticsearchUsername,
    password: configs.elasticsearchPassword,
  },
  tls: {
    ca: fs.readFileSync(configs.elasticsearchCaCertPath),
    rejectUnauthorized: false,
  },
});

exports.info = async () => {
  const info = await elasticsearch.info();
  return info;
};

exports.config = async () => {
  //streamStatus
  const existsStreamStatus = await elasticsearch.indices.exists({
    index: "streamstatus",
  });
  if (!existsStreamStatus) {
    await elasticsearch.indices.create({ index: "streamstatus" });

    await elasticsearch.index({
      index: "streamstatus",
      document: {
        twitter: false,
        twitch: false,
        youTube: false,
        twitterFlag: false,
        twitchFlag: false,
        youTubeFlag: false,
        twitterLength: 250,
        twitchLength: 250,
        youTubeLength: 250,
      },
    });
  }

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

exports.clean = async () => {
  // await elasticsearch.indices.delete({ index: "youtubevideos" });
  // await elasticsearch.indices.delete({ index: "youtubecomments" });

  await elasticsearch.indices.delete({ index: "twits" });

  // await elasticsearch.indices.delete({ index: "twitchstreams" });
  // await elasticsearch.indices.delete({ index: "twitchcomments" });
};

// Twitter
exports.getLastTwitId = async () => {
  try {
    const tweet = await elasticsearch.search({
      index: "twits",
      size: 1,
      sort: [{ "data.createdAt": { order: "desc" } }],
    });
    return tweet?.hits?.hits[0]?._source?.data?.id || null;
  } catch (err) {
    return null;
  }
};

exports.indexTwit = async (data, countTweets) => {
  try {
    data.text = data.text
      .replace(/\B@\w*[a-zA-Z:]+\w*/g, "")
      .replace(/(^RT)/g, "")
      .trim();
    data.prediction = null;
    data.response = null;
    data.timestamp = Date.now();
    data.createdAt = data.created_at;

    const checkTweet = await elasticsearch.search({
      index: "twits",
      query: {
        bool: {
          must: [
            {
              match: {
                "data.id": data.id,
              },
            },
          ],
        },
      },
    });
    const checkValue = checkTweet?.hits?.total?.value || 0;

    if (checkValue > 0) {
      return countTweets;
    }

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

    return countTweets + 1;
  } catch (e) {
    return countTweets;
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
      sort: [{ "data.createdAt": { order: "desc" } }],
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

    const checkVideo = await elasticsearch.search({
      index: "youtubevideos",
      query: {
        bool: {
          must: [
            {
              match: {
                "video.id": video.id,
              },
            },
          ],
        },
      },
    });
    const checkValue = checkVideo?.hits?.total?.value || 0;

    if (checkValue > 0) {
      return;
    }

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

exports.indexYouTubeComment = async (data, countComments) => {
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

      const checkComment = await elasticsearch.search({
        index: "youtubecomments",
        query: {
          bool: {
            must: [
              {
                match: {
                  "comment.id": comment.id,
                },
              },
            ],
          },
        },
      });
      const checkValue = checkComment?.hits?.total?.value || 0;

      if (checkValue > 0) {
        return countComments;
      }

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

      return countComments + 1;
    }
  } catch (e) {
    return countComments;
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
    const checkStream = await elasticsearch.search({
      index: "twitchstreams",
      query: {
        bool: {
          must: [
            {
              match: {
                "stream.id": stream.id,
              },
            },
          ],
        },
      },
    });
    const checkValue = checkStream?.hits?.total?.value || 0;
    if (checkValue > 0) {
      return;
    }

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
      stream: null,
      video: null,
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

exports.getTwitchComments = async (
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "publishedAt",
  sortOrder = "desc"
) => {
  try {
    const from = (page - 1) * size;
    let filter = {
      index: "twitchcomments",
      size,
      sort: [{ [`comment.${sortLabel}`]: { order: sortOrder } }],
      from,
      body: {
        query: {
          bool: {
            must: [],
          },
        },
      },
    };

    if (search) {
      filter.body = {
        query: {
          bool: {
            must: [
              {
                wildcard: {
                  "comment.textDisplay": {
                    value: `*${search}*`,
                  },
                },
              },
            ],
          },
        },
      };
    }

    if (prediction == 2) {
      filter.body.query.bool.must.push({
        constant_score: {
          filter: {
            exists: {
              field: "comment.prediction",
            },
          },
        },
      });
    } else if (prediction == 1) {
      filter.body.query.bool.must.push({
        bool: {
          must_not: {
            exists: {
              field: "comment.prediction",
            },
          },
        },
      });
    }

    const comments = await elasticsearch.search(filter);
    return comments?.hits || [];
  } catch (err) {
    throw err;
  }
};

//StreamStatus
exports.getStreamStatus = async () => {
  try {
    const streamStatus = await elasticsearch.search({
      index: "streamstatus",
      size: 1,
    });
    return streamStatus?.hits?.hits[0]?._source || null;
  } catch (err) {
    throw err;
  }
};

exports.updateStreamStatus = async (updatedData) => {
  try {
    const streamStatus = await elasticsearch.search({
      index: "streamstatus",
      size: 1,
    });

    const id = streamStatus?.hits?.hits[0]?._id || null;

    if (id) {
      elasticsearch.update({
        index: "streamstatus",
        id,
        doc: updatedData,
      });
    }
  } catch (err) {
    throw err;
  }
};
