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
    data.timestamp = Date.now();
    data.createdAt = data.created_at;
    data.referenced_tweets = data?.referenced_tweets || [];
    data.edit_history_tweet_ids = data?.edit_history_tweet_ids || [];

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

exports.getTwits = async (
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "createdAt",
  sortOrder = "desc"
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
                  "data.text": {
                    value: `*${search}*`,
                    case_insensitive: true,
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
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "publishedAt",
  sortOrder = "desc"
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

      const comments = await elasticsearch.search(filter);

      result.comments = comments?.hits?.hits || [];
      result.totalComments = comments?.hits?.total?.value || 0;
      //end::Comments
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
        replies: data?.replies || [],
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
    console.log("e", e);
    return countComments;
  }
};

exports.getYouTubeComments = async (
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
      index: "youtubecomments",
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
                    case_insensitive: true,
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

exports.getTwitchStream = async (
  streamId,
  size = 10,
  page = 1,
  search = "",
  prediction = 0,
  sortLabel = "publishedAt",
  sortOrder = "desc"
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

      const comments = await elasticsearch.search(filter);

      result.comments = comments?.hits?.hits || [];
      result.totalComments = comments?.hits?.total?.value || 0;
      //end::Comments

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
                    case_insensitive: true,
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
