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

  //HowItWorks
  const existsHowItWorks = await elasticsearch.indices.exists({
    index: "howitworks",
  });
  if (!existsHowItWorks) {
    await elasticsearch.indices.create({ index: "howitworks" });

    await elasticsearch.index({
      index: "howitworks",
      document: {
        text: "",
      },
    });
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
    data.responseObj = null;
    data.timestamp = Date.now();
    data.createdAt = data.created_at;
    data.referenced_tweets = data?.referenced_tweets || [];
    data.edit_history_tweet_ids = data?.edit_history_tweet_ids || [];
    data.version = 0;

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

    const chatBotPrediction = await axios.post(
      "predict/v2/hatespeechdictionary",
      {
        source: "twitter",
        items: [{ id: data.id, text: data.text }],
      }
    );

    const isHate = chatBotPrediction?.data?.response[0]?.prediction || 0;
    data.version = chatBotPrediction?.data?.response[0]?.version || 0;

    if (isHate === 1) {
      data.prediction = chatBotPrediction.data.response[0];

      const chatBotResponse = await axios.post("chatter/v2/mainchatter", {
        source: "twitter",
        items: [{ id: data.id, text: data.text }],
      });

      data.response = chatBotResponse.data?.response[0]?.answer || null;
      data.responseObj = chatBotResponse.data?.response[0] || null;
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

exports.getTwits = async (
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "createdAt",
  sortOrder = "desc",
  dateFrom = "",
  dateTo = "",
  category = "all"
) => {
  try {
    const from = (page - 1) * size;
    let filter = {
      index: "twits",
      size,
      sort: [{ [`data.${sortLabel}`]: { order: sortOrder } }],
      from,
      body: {
        query: {
          bool: {
            must: [],
            filter: [],
          },
        },
      },
    };

    if (search) {
      filter.body.query.bool.must.push({
        wildcard: {
          "data.text": {
            value: `*${search}*`,
            case_insensitive: true,
          },
        },
      });
    }

    if (prediction == 2) {
      filter.body.query.bool.must.push({
        constant_score: {
          filter: {
            exists: {
              field: "data.prediction",
            },
          },
        },
      });
    } else if (prediction == 1) {
      filter.body.query.bool.must.push({
        bool: {
          must_not: {
            exists: {
              field: "data.prediction",
            },
          },
        },
      });
    }

    if (category != "all") {
      filter.body.query.bool.must.push({
        match: {
          [`data.prediction.dimensions.${category}`]: 1,
        },
      });
    }

    if (dateFrom && dateTo) {
      filter.body.query.bool.filter.push({
        range: {
          "data.timestamp": {
            format: "strict_date_optional_time",
            gte: dateFrom,
            lte: dateTo,
          },
        },
      });
    }

    const total = await elasticsearch.count({ index: "twits" });
    const resComments = await elasticsearch.search(filter);
    const twits = resComments || [];
    const comments = { ...twits, totalComments: total.count };
    return comments;
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

exports.getYouTubeVideos = async (
  videoId,
  id,
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "publishedAt",
  sortOrder = "desc",
  dateFrom = "",
  dateTo = "",
  category = "all"
) => {
  try {
    const result = {
      video: {},
      comments: [],
      totalComments: 0,
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

      //Comments
      const from = (page - 1) * size;
      let filter = {
        index: "youtubecomments",
        size,
        sort: [{ [`comment.${sortLabel}`]: { order: sortOrder } }],
        from,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    "comment.videoId": videoId,
                  },
                },
              ],
              filter: [],
            },
          },
        },
      };

      if (search) {
        filter.body.query.bool.must.push({
          wildcard: {
            "comment.textDisplay": {
              value: `*${search}*`,
              case_insensitive: true,
            },
          },
        });
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

      if (category != "all") {
        filter.body.query.bool.must.push({
          match: {
            [`comment.prediction.dimensions.${category}`]: 1,
          },
        });
      }

      if (dateFrom && dateTo) {
        filter.body.query.bool.filter.push({
          range: {
            "comment.timestamp": {
              format: "strict_date_optional_time",
              gte: dateFrom,
              lte: dateTo,
            },
          },
        });
      }

      const comments = await elasticsearch.search(filter);

      result.comments = comments?.hits?.hits || [];
      result.totalComments = comments?.hits?.total?.value || 0;
      //end::Comments

      const selectedComment = await elasticsearch.search({
        index: "youtubecomments",
        size: 1,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    "comment.id": id,
                  },
                },
              ],
            },
          },
        },
      });

      result.selectedComment = selectedComment?.hits?.hits || [];
      if (result.selectedComment.length > 0)
        result.selectedComment =
          result.selectedComment[0]?._source?.comment || null;
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
        responseObj: null,
        timestamp: Date.now(),
        replies: data?.replies || [],
        version: 0,
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
        "predict/v2/hatespeechdictionary",
        {
          source: "youtube",
          items: [{ id: comment.id, text: comment.textDisplay }],
        }
      );

      const isHate = chatBotPrediction?.data?.response[0]?.prediction || 0;
      comment.version = chatBotPrediction?.data?.response[0]?.version || 0;

      if (isHate === 1) {
        comment.prediction = chatBotPrediction.data.response[0];

        const chatBotResponse = await axios.post("chatter/v2/mainchatter", {
          source: "youtube",
          items: [{ id: comment.id, text: comment.textDisplay }],
        });

        comment.response = chatBotResponse.data?.response[0]?.answer || null;
        comment.responseObj = chatBotResponse.data?.response[0] || null;
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
    console.log("Error", e);
    return countComments;
  }
};

exports.getYouTubeComments = async (
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "publishedAt",
  sortOrder = "desc",
  dateFrom = "",
  dateTo = "",
  category = "all"
) => {
  try {
    const from = (page - 1) * size;
    let filter = {
      index: "youtubecomments",
      size,
      sort: [{ [`comment.${sortLabel}`]: { order: sortOrder } }],
      from,
      body: {
        query: {
          bool: {
            must: [],
            filter: [],
          },
        },
      },
    };

    if (search) {
      filter.body.query.bool.must.push({
        wildcard: {
          "comment.textDisplay": {
            value: `*${search}*`,
            case_insensitive: true,
          },
        },
      });
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

    if (category != "all") {
      filter.body.query.bool.must.push({
        match: {
          [`comment.prediction.dimensions.${category}`]: 1,
        },
      });
    }

    if (dateFrom && dateTo) {
      filter.body.query.bool.filter.push({
        range: {
          "comment.timestamp": {
            format: "strict_date_optional_time",
            gte: dateFrom,
            lte: dateTo,
          },
        },
      });
    }

    const total = await elasticsearch.count({ index: "youtubecomments" });
    const resComments = await elasticsearch.search(filter);
    const hits = resComments?.hits || [];
    const comments = { ...hits, totalComments: total.count };

    return comments;
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
      responseObj: null,
      timestamp: Date.now(),
      version: 0,
    };

    const chatBotPrediction = await axios.post(
      "predict/v2/hatespeechdictionary",
      {
        source: "twitch",
        items: [{ id: comment.streamId, text: comment.textDisplay }],
      }
    );

    const isHate = chatBotPrediction?.data?.response[0]?.prediction || 0;
    comment.version = chatBotPrediction?.data?.response[0]?.version || 0;

    if (isHate === 1) {
      comment.prediction = chatBotPrediction.data.response[0];

      const chatBotResponse = await axios.post("chatter/v2/mainchatter", {
        source: "twitch",
        items: [{ id: comment.streamId, text: comment.textDisplay }],
      });

      comment.response = chatBotResponse.data?.response[0]?.answer || null;
      comment.responseObj = chatBotResponse.data?.response[0] || null;
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

exports.getTwitchStream = async (
  streamId,
  id,
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "publishedAt",
  sortOrder = "desc",
  dateFrom = "",
  dateTo = "",
  category = "all"
) => {
  try {
    const result = {
      stream: null,
      video: null,
      comments: [],
      totalComments: 0,
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

      //Comments
      const from = (page - 1) * size;
      let filter = {
        index: "twitchcomments",
        size,
        sort: [{ [`comment.${sortLabel}`]: { order: sortOrder } }],
        from,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    "comment.streamId": streamId,
                  },
                },
              ],
              filter: [],
            },
          },
        },
      };

      if (search) {
        filter.body.query.bool.must.push({
          wildcard: {
            "comment.textDisplay": {
              value: `*${search}*`,
              case_insensitive: true,
            },
          },
        });
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

      if (category != "all") {
        filter.body.query.bool.must.push({
          match: {
            [`comment.prediction.dimensions.${category}`]: 1,
          },
        });
      }

      if (dateFrom && dateTo) {
        filter.body.query.bool.filter.push({
          range: {
            "comment.timestamp": {
              format: "strict_date_optional_time",
              gte: dateFrom,
              lte: dateTo,
            },
          },
        });
      }

      const comments = await elasticsearch.search(filter);

      result.comments = comments?.hits?.hits || [];
      result.totalComments = comments?.hits?.total?.value || 0;
      //end::Comments

      const selectedComment = await elasticsearch.search({
        index: "twitchcomments",
        size: 1,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    "comment.id": id,
                  },
                },
              ],
            },
          },
        },
      });

      result.selectedComment = selectedComment?.hits?.hits || [];
      if (result.selectedComment.length > 0)
        result.selectedComment =
          result.selectedComment[0]?._source?.comment || null;

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
  sortOrder = "desc",
  dateFrom = "",
  dateTo = "",
  category = "all"
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
            filter: [],
          },
        },
      },
    };

    if (search) {
      filter.body.query.bool.must.push({
        wildcard: {
          "comment.textDisplay": {
            value: `*${search}*`,
            case_insensitive: true,
          },
        },
      });
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

    if (category != "all") {
      filter.body.query.bool.must.push({
        match: {
          [`comment.prediction.dimensions.${category}`]: 1,
        },
      });
    }

    if (dateFrom && dateTo) {
      filter.body.query.bool.filter.push({
        range: {
          "comment.timestamp": {
            format: "strict_date_optional_time",
            gte: dateFrom,
            lte: dateTo,
          },
        },
      });
    }

    const total = await elasticsearch.count({ index: "twitchcomments" });
    const resComments = await elasticsearch.search(filter);
    const hits = resComments?.hits || [];
    const comments = { ...hits, totalComments: total.count };
    return comments;
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

exports.search = async (dateFrom, dateTo) => {
  //console.log('inside elasticsearch.js, search : ' + dateFrom + ' ' + dateTo)
  try {
    let filter = {
      index: ["youtubecomments", "twitchcomments", "twits"],
      size: 10000, //max size
      scroll: "1m",
      body: {
        query: {
          bool: {
            should: [
              // OR operator, because indexes have different structure
              {
                bool: {
                  filter: [
                    {
                      range: {
                        "comment.timestamp": {
                          // indexes: 'youtubecomments', twitchcomments
                          format: "strict_date_optional_time",
                          gte: dateFrom,
                          lte: dateTo,
                        },
                      },
                    },
                  ],
                },
              },
              {
                range: {
                  "data.timestamp": {
                    // index: 'twits'
                    format: "strict_date_optional_time",
                    gte: dateFrom,
                    lte: dateTo,
                  },
                },
              },
            ],
          },
        },
      },
    };

    let i = 1;
    // first request: 'POST /index/type/_search?scroll=1m'
    streamStatus = await elasticsearch.search(filter);
    //console.log('inside elasticsearch.js, streamStatus %d : %O', i, streamStatus) //first response
    result = streamStatus?.hits || [];
    scroll_id = {
      scroll_id: streamStatus._scroll_id,
    };
    let more_to_read =
      streamStatus?.hits.total.value - streamStatus?.hits.hits.length;
    i++;

    // subsequent requests 'POST /_search/scroll')
    while (more_to_read > 0) {
      streamStatus = await elasticsearch.scroll(scroll_id);
      //console.log('inside elasticsearch.js, streamStatus %d  : %O', i, streamStatus) //subsequent responses
      result.hits = result.hits.concat(streamStatus?.hits.hits);
      more_to_read -= streamStatus?.hits.hits.length;
      if (more_to_read < 0) {
        more_to_read = 0;
      }
      //console.log('more to read : %d', more_to_read)
      i++;
    }
    //console.log('inside elasticsearch.js, result : %O', result)
    //console.log('inside elasticsearch.js, result size : ' + result.hits.length)
    return result;
  } catch (err) {
    throw err;
  }
};
exports.getHowItWorks = async () => {
  try {
    const res = await elasticsearch.search({
      index: "howitworks",
      size: 1,
    });

    return res;
  } catch (err) {
    throw err;
  }
};

exports.updateHowItWorks = async (text) => {
  try {
    const howitworks = await elasticsearch.search({
      index: "howitworks",
      size: 1,
    });

    const id = howitworks?.hits?.hits[0]?._id || null;

    if (id) {
      elasticsearch.update({
        index: "howitworks",
        id,
        doc: {
          text,
        },
      });
    }
  } catch (err) {
    throw err;
  }
};

exports.getRandomItem = async (type) => {
  try {
    const forceHate = type > 1;
    const indexArray = ["youtubecomments", "twitchcomments", "twits"];
    const index = indexArray[Math.floor(Math.random() * indexArray.length)];
    const randomBoolean = Math.random() < 0.5;
    let body = null;
    const startDate = new Date("2024-01-02T00:00:00");

    if (randomBoolean || forceHate) {
      const filter = {
        index,
        body: {
          size: 100,
          query: {
            bool: {
              must: [
                {
                  range: {
                    [index === "twits"
                      ? "data.timestamp"
                      : "comment.timestamp"]: {
                      gte: startDate.getTime(),
                    },
                  },
                },
                {
                  exists: {
                    field:
                      index === "twits"
                        ? "data.prediction"
                        : "comment.prediction",
                  },
                },
              ],
            },
          },
        },
      };

      if (type === 3) {
        filter.body.query.bool.must.push({
          term: {
            [index === "twits"
              ? "data.prediction.prediction_dict"
              : "comment.prediction.prediction_dict"]: 1,
          },
        });
      }

      body = await elasticsearch.search(filter);
    } else {
      body = await elasticsearch.search({
        index,
        body: {
          size: 100,
          query: {
            bool: {
              must: [
                {
                  range: {
                    [index === "twits"
                      ? "data.timestamp"
                      : "comment.timestamp"]: {
                      gte: startDate.getTime(),
                    },
                  },
                },
              ],
            },
          },
        },
      });
    }

    // Select a random item from the result
    const randomIndex = Math.floor(Math.random() * body.hits.hits.length);
    const randomItem = body.hits.hits[randomIndex]._source;

    return randomItem[index === "twits" ? "data" : "comment"];
  } catch (err) {
    throw err;
  }
};

exports.getAnswers = async (forceHate = false) => {
  try {
    const answers = await axios.get("predict/v2/answers");
    return answers?.data?.response || [];
  } catch (err) {
    throw err;
  }
};
